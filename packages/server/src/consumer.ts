import { AWSError, SQS } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import Debug from 'debug';
import { EventEmitter } from 'events';
import { autoBind } from './utils';
import { SQSError, TimeoutError } from './errors';
import { ConsumerOptions, ReceiveMessageRequest, ReceieveMessageResponse, SQSMessage, TimeoutResponse } from './types';

const debug = Debug('sqs-consumer');

const createTimeout = (durationMs: number): TimeoutResponse => {
  let timeoutHandle;
  const promise = new Promise((resolve, reject) => {
    timeoutHandle = setTimeout(() => {
      reject(new TimeoutError());
    }, durationMs);
  });

  return { timeoutHandle, promise };
};

const isConnectionError = (err: Error): boolean => {
  if (err instanceof SQSError) {
    return err.statusCode === 403 || err.code === 'CredentialsError' || err.code === 'UnknownEndpoint';
  }
  return false;
};

const toSQSError = (err: AWSError, message: string): SQSError => {
  const sqsError = new SQSError(message);
  sqsError.code = err.code;
  sqsError.statusCode = err.statusCode;
  sqsError.region = err.region;
  sqsError.retryable = err.retryable;
  sqsError.hostname = err.hostname;
  sqsError.time = err.time;

  return sqsError;
};

export class Consumer extends EventEmitter {
  private queueUrl: string;
  private handleMessage?: (message: SQSMessage) => Promise<void>;
  private handleMessageBatch?: (message: SQSMessage[]) => Promise<void>;
  private handleMessageTimeout?: number;
  private attributeNames: string[];
  private messageAttributeNames: string[];
  private stopped: boolean;
  private batchSize: number;
  private visibilityTimeout: number;
  private waitTimeSeconds: number;
  private authenticationErrorTimeout: number;
  private pollingWaitTimeMs: number;
  private terminateVisibilityTimeout: boolean;
  private sqs: SQS;

  constructor(options: ConsumerOptions) {
    super();

    if (!options.queueUrl) {
      throw new Error(`Missing SQS consumer option [ queueUrl ].`);
    }
    if (!options.handleMessage && !options.handleMessageBatch) {
      throw new Error(`Missing SQS consumer option [ handleMessage or handleMessageBatch  ].`);
    }

    this.queueUrl = options.queueUrl;
    this.handleMessage = options.handleMessage;
    this.handleMessageBatch = options.handleMessageBatch;
    this.handleMessageTimeout = options.handleMessageTimeout;
    this.attributeNames = options.attributeNames || [];
    this.messageAttributeNames = options.messageAttributeNames || [];
    this.stopped = true;
    this.batchSize = Math.max(1, Math.min(9, options.batchSize || 1));
    this.visibilityTimeout = options.visibilityTimeout || 30;
    this.terminateVisibilityTimeout = options.terminateVisibilityTimeout || false;
    this.waitTimeSeconds = options.waitTimeSeconds || 20;
    this.authenticationErrorTimeout = options.authenticationErrorTimeout || 10000;
    this.pollingWaitTimeMs = options.pollingWaitTimeMs || 0;
    this.sqs =
      options.sqs ||
      new SQS({
        region: options.region || process.env.AWS_REGION || 'us-east-1',
      });

    autoBind(this);
  }

  public get isRunning(): boolean {
    return !this.stopped;
  }

  public static create(options: ConsumerOptions): Consumer {
    return new Consumer(options);
  }

  public start(): void {
    if (this.stopped) {
      debug('Starting consumer');
      this.stopped = false;
      this.poll();
    }
  }

  public stop(): void {
    debug('Stopping consumer');
    this.stopped = true;
  }

  private async handleSqsResponse(response: ReceieveMessageResponse): Promise<void> {
    debug('Received SQS response');
    debug(response);

    if (!response) {
      return;
    }

    if (this.stopped) {
      debug('Skipping processing of SQS response (Consumer stopped. Message will NOT be deleted)');
      return;
    }

    if (response.Messages !== undefined && response.Messages && response.Messages.length > 0) {
      if (this.handleMessageBatch) {
        // Prefer handling messages in batch when available
        await this.processMessageBatch(response.Messages);
      } else {
        await Promise.all(response.Messages.map(this.processMessage));
      }
      this.emit('response_processed');
    } else {
      this.emit('empty');
    }
  }

  private async processMessage(message: SQSMessage): Promise<void> {
    this.emit('message_received', message);

    try {
      await this.executeHandler(message);
      await this.deleteMessage(message);
      this.emit('message_processed', message);
    } catch (err) {
      this.emitError(err, message);

      if (this.terminateVisibilityTimeout) {
        try {
          await this.terminateVisabilityTimeout(message);
        } catch (err) {
          this.emit('error', err, message);
        }
      }
    }
  }

  private async receiveMessage(params: ReceiveMessageRequest): Promise<ReceieveMessageResponse> {
    try {
      return await this.sqs.receiveMessage(params).promise();
    } catch (err) {
      throw toSQSError(err, `SQS receive message failed: ${err.message}`);
    }
  }

  private async deleteMessage(message: SQSMessage): Promise<void> {
    debug('Deleting message %s', message.MessageId);

    if (!message.ReceiptHandle) {
      throw new Error('Unable to delete Message: No ReceiptHandle');
    }

    const deleteParams = {
      QueueUrl: this.queueUrl,
      ReceiptHandle: message.ReceiptHandle,
    };

    try {
      await this.sqs.deleteMessage(deleteParams).promise();
    } catch (err) {
      throw toSQSError(err, `SQS delete message failed: ${err.message}`);
    }
  }

  private async executeHandler(message: SQSMessage): Promise<void> {
    let timeoutHandle;

    if (!this.handleMessage) {
      throw new Error('Unable to execute message handler: No `handleMessage` function defined');
    }

    try {
      if (this.handleMessageTimeout) {
        let { timeoutHandle: timeoutHandleInner, promise } = createTimeout(this.handleMessageTimeout);
        timeoutHandle = timeoutHandleInner;

        await Promise.race([this.handleMessage(message), promise]);
      } else {
        await this.handleMessage(message);
      }
    } catch (err) {
      if (err instanceof TimeoutError) {
        err.message = `Message handler timed out after ${this.handleMessageTimeout}ms: Operation timed out.`;
      } else {
        err.message = `Unexpected message handler failure: ${err.message}`;
      }
      throw err;
    } finally {
      if (timeoutHandle) {
        clearTimeout(timeoutHandle);
      }
    }
  }

  private async terminateVisabilityTimeout(message: SQSMessage): Promise<PromiseResult<any, AWSError>> {
    if (!message.ReceiptHandle) {
      throw new Error('Unable to change message visibility: No ReceiptHandle');
    }

    return this.sqs
      .changeMessageVisibility({
        QueueUrl: this.queueUrl,
        ReceiptHandle: message.ReceiptHandle,
        VisibilityTimeout: 0,
      })
      .promise();
  }

  private emitError(err: Error, message: SQSMessage): void {
    if (err.name === SQSError.name) {
      this.emit('error', err, message);
    } else if (err instanceof TimeoutError) {
      this.emit('timeout_error', err, message);
    } else {
      this.emit('processing_error', err, message);
    }
  }

  private poll(): void {
    if (this.stopped) {
      this.emit('stopped');
      return;
    }

    debug('Polling for messages');
    const receiveParams = {
      QueueUrl: this.queueUrl,
      AttributeNames: this.attributeNames,
      MessageAttributeNames: this.messageAttributeNames,
      MaxNumberOfMessages: this.batchSize,
      WaitTimeSeconds: this.waitTimeSeconds,
      VisibilityTimeout: this.visibilityTimeout,
    };

    let currentPollingTimeout = this.pollingWaitTimeMs;
    this.receiveMessage(receiveParams)
      .then(this.handleSqsResponse)
      .catch((err) => {
        this.emit('error', err);
        if (isConnectionError(err)) {
          debug('There was an authentication error. Pausing before retrying.');
          currentPollingTimeout = this.authenticationErrorTimeout;
        }
        return;
      })
      .then(() => {
        setTimeout(this.poll, currentPollingTimeout);
      })
      .catch((err) => {
        this.emit('error', err);
      });
  }

  private async processMessageBatch(messages: SQSMessage[]): Promise<void> {
    messages.forEach((message) => {
      this.emit('message_received', message);
    });

    try {
      await this.executeBatchHandler(messages);
      await this.deleteMessageBatch(messages);
      messages.forEach((message) => {
        this.emit('message_processed', message);
      });
    } catch (err) {
      this.emit('error', err, messages);

      if (this.terminateVisibilityTimeout) {
        try {
          await this.terminateVisabilityTimeoutBatch(messages);
        } catch (err) {
          this.emit('error', err, messages);
        }
      }
    }
  }

  private async deleteMessageBatch(messages: SQSMessage[]): Promise<void> {
    debug('Deleting messages %s', messages.map((msg) => msg.MessageId).join(' ,'));

    const deleteParams = {
      QueueUrl: this.queueUrl,
      Entries: messages.map((message) => {
        if (!message.MessageId) {
          throw new Error('Unable to delete Message: No MessageId');
        }
        if (!message.ReceiptHandle) {
          throw new Error('Unable to delete Message: No ReceiptHandle');
        }
        return {
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
        };
      }),
    };

    try {
      await this.sqs.deleteMessageBatch(deleteParams).promise();
    } catch (err) {
      throw toSQSError(err, `SQS delete message failed: ${err.message}`);
    }
  }

  private async executeBatchHandler(messages: SQSMessage[]): Promise<void> {
    if (!this.handleMessageBatch) {
      throw new Error('Unable to executeBatchHandler: No handleMessageBatch function defined');
    }

    try {
      await this.handleMessageBatch(messages);
    } catch (err) {
      err.message = `Unexpected message handler failure: ${err.message}`;
      throw err;
    }
  }

  private async terminateVisabilityTimeoutBatch(messages: SQSMessage[]): Promise<PromiseResult<any, AWSError>> {
    const params = {
      QueueUrl: this.queueUrl,
      Entries: messages.map((message) => {
        if (!message.MessageId) {
          throw new Error('Unable to delete Message: No MessageId');
        }
        if (!message.ReceiptHandle) {
          throw new Error('Unable to delete Message: No ReceiptHandle');
        }
        return {
          Id: message.MessageId,
          ReceiptHandle: message.ReceiptHandle,
          VisibilityTimeout: 0,
        };
      }),
    };

    return this.sqs.changeMessageVisibilityBatch(params).promise();
  }
}

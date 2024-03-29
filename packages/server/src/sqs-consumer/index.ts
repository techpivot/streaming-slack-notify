import { AWSError, Request, SQS } from 'aws-sdk';
import { PromiseResult } from 'aws-sdk/lib/request';
import Debug from 'debug';
import { EventEmitter } from 'events';
import { SQSError, TimeoutError } from './errors';
import { ConsumerOptions } from './interfaces';
import { createTimeout, toSQSError, isConnectionError } from './utils';

const debug = Debug('sqs-consumer');

export class Consumer extends EventEmitter {
  private queueUrl: string;
  private handleMessage?: (message: SQS.Types.Message) => Promise<void>;
  private handleMessageBatch?: (message: SQS.Types.Message[]) => Promise<void>;
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
  private activeReceiveMessage?: Request<SQS.Types.ReceiveMessageResult, AWSError>;

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
    this.batchSize = Math.max(1, Math.min(10, options.batchSize || 1));
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

    this.on('error', (error: SQSError) => {
      debug('[ERROR]', error.message);
    });
  }

  public isRunning(): boolean {
    return !this.stopped;
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
    if (this.isRunning() && this.activeReceiveMessage) {
      this.activeReceiveMessage.abort();
    }
    this.stopped = true;
  }

  private async handleSqsResponse(response: PromiseResult<SQS.Types.ReceiveMessageResult, AWSError>): Promise<void> {
    debug(`Received SQS response - count ${(response.Messages || []).length}`);
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
        await Promise.all(response.Messages.map(this.processMessage.bind(this)));
      }
      this.emit('response_processed');
    } else {
      this.emit('empty');
    }
  }

  private async processMessage(message: SQS.Types.Message): Promise<void> {
    this.emit('message_received', message);
    debug('Processing message');

    try {
      debug('Executing handler');
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

  private async receiveMessage(
    params: SQS.Types.ReceiveMessageRequest
  ): Promise<PromiseResult<SQS.Types.ReceiveMessageResult, AWSError>> {
    try {
      this.activeReceiveMessage = this.sqs.receiveMessage(params);
      return await this.activeReceiveMessage.promise();
    } catch (err) {
      throw toSQSError(err, `SQS receive message failed: ${err.message}`);
    }
  }

  private async deleteMessage(message: SQS.Types.Message): Promise<void> {
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

  private async executeHandler(message: SQS.Types.Message): Promise<void> {
    let timeoutHandle;

    if (!this.handleMessage) {
      throw new Error('Unable to execute message handler: No `handleMessage` function defined');
    }

    try {
      if (this.handleMessageTimeout) {
        const { timeoutHandle: timeoutHandleInner, promise } = createTimeout(this.handleMessageTimeout);
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

  private async terminateVisabilityTimeout(
    message: SQS.Types.Message
  ): Promise<PromiseResult<Record<string, unknown>, AWSError>> {
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

  private emitError(err: Error, message: SQS.Types.Message): void {
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

    const receiveParams = {
      QueueUrl: this.queueUrl,
      AttributeNames: this.attributeNames,
      MessageAttributeNames: this.messageAttributeNames,
      MaxNumberOfMessages: this.batchSize,
      WaitTimeSeconds: this.waitTimeSeconds,
      VisibilityTimeout: this.visibilityTimeout,
    };

    debug('Polling for messages');

    let currentPollingTimeout = this.pollingWaitTimeMs;
    this.receiveMessage(receiveParams)
      .then(this.handleSqsResponse.bind(this))
      .catch((err) => {
        this.emit('error', err);
        if (isConnectionError(err)) {
          debug('There was an authentication error. Pausing before retrying.');
          currentPollingTimeout = this.authenticationErrorTimeout;
        }
        return;
      })
      .then(() => {
        setTimeout(this.poll.bind(this), currentPollingTimeout);
      })
      .catch((err) => {
        this.emit('error', err);
      });
  }

  private async processMessageBatch(messages: SQS.Types.Message[]): Promise<void> {
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

  private async deleteMessageBatch(messages: SQS.Types.Message[]): Promise<void> {
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
      throw toSQSError(err, `SQS batch delete message failed: ${err.message}`);
    }
  }

  private async executeBatchHandler(messages: SQS.Types.Message[]): Promise<void> {
    if (!this.handleMessageBatch) {
      throw new Error('Unable to execute BatchHandler: No handleMessageBatch function defined');
    }

    try {
      await this.handleMessageBatch(messages);
    } catch (err) {
      err.message = `Unexpected batch message handler failure: ${err.message}`;
      throw err;
    }
  }

  private async terminateVisabilityTimeoutBatch(
    messages: SQS.Types.Message[]
  ): Promise<PromiseResult<SQS.Types.ChangeMessageVisibilityBatchResult, AWSError>> {
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

import { SQS } from 'aws-sdk';

export type SQSMessage = SQS.Types.Message;

export interface ConsumerOptions {
  queueUrl?: string;
  attributeNames?: string[];
  messageAttributeNames?: string[];
  stopped?: boolean;
  batchSize?: number;
  visibilityTimeout?: number;
  waitTimeSeconds?: number;
  authenticationErrorTimeout?: number;
  pollingWaitTimeMs?: number;
  terminateVisibilityTimeout?: boolean;
  heartbeatInterval?: number;
  sqs?: SQS;
  region?: string;
  handleMessageTimeout?: number;
  handleMessage?(message: SQSMessage): Promise<void>;
  handleMessageBatch?(messages: SQSMessage[]): Promise<void>;
}

export interface TimeoutResponse {
  timeoutHandle?: NodeJS.Timeout;
  promise: Promise<void>;
}

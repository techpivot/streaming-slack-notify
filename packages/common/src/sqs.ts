import { SQS } from 'aws-sdk';
import { SendMessageResult } from 'aws-sdk/clients/sqs';
import { REGION } from './const';
import { getSqsQueueUrl } from './ssm';
import { SQSBody } from './types';

const sqs = new SQS({ region: REGION });

export const addToQueue = async (body: SQSBody): Promise<SendMessageResult> => {
  return sqs
    .sendMessage({
      MessageBody: JSON.stringify(body),
      QueueUrl: await getSqsQueueUrl(),
    })
    .promise();
};

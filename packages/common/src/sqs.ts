import { SQS } from 'aws-sdk';
import { SendMessageResult } from 'aws-sdk/clients/sqs';
import { REGION } from './const';
import { getSqsQueueUrl } from './ssm';
import { SQSBody } from './types';

let sqs: any = null;

const getSqs = (): SQS => {
  if (sqs === null) {
    sqs = new SQS({
      region: REGION,
    });
  }

  return sqs;
};

export const addToQueue = async (body: SQSBody): Promise<SendMessageResult> => {
  return getSqs()
    .sendMessage({
      MessageBody: JSON.stringify(body),
      QueueUrl: await getSqsQueueUrl(),
    })
    .promise();
};

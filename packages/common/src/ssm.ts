import { SSM } from 'aws-sdk';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { REGION, SSM_PARAMETER_QUEUE_URL } from './const';

const ssm = new SSM({ region: REGION });
let queueUrl: string = '';

export const getSqsQueueUrl = async (): Promise<string> => {
  if (queueUrl !== '') {
    return queueUrl;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_PARAMETER_QUEUE_URL,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  queueUrl = response.Parameter.Value;

  return queueUrl;
};

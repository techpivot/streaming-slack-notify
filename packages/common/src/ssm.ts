import { SSM } from 'aws-sdk';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { REGION, SSM_PARAMETER_QUEUE_URL } from './const';

export const getSqsQueueUrl = async (): Promise<string> => {
  const ssm = new SSM({ region: REGION });

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

  return response.Parameter.Value;
};

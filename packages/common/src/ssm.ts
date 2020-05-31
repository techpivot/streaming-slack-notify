import { SSM } from 'aws-sdk';
import { GetParameterResult } from 'aws-sdk/clients/ssm';
import { REGION, SSM_PARAMETER_QUEUE_URL } from './const';

const ssm = new SSM({ region: REGION });
let queueUrl: string = '';

/**
 * Queue URL is available in Lambda as environment variable (semi-secure) or parsed from
 * SSM if being requested by the polling server in ECS.
 */
export const getSqsQueueUrl = async (): Promise<string> => {
  if (queueUrl !== '') {
    return queueUrl;
  }

  // Try environment variable.
  if (process.env.queue_url !== undefined) {
    queueUrl = process.env.queue_url;
  } else {
    // Lastly, pull from SSM
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
  }

  return queueUrl;
};

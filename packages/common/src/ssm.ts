import { SSM } from 'aws-sdk';
import { GetParameterResult, GetParametersRequest, GetParametersResult } from 'aws-sdk/clients/ssm';
import { REGION, SSM_PARAMETER_QUEUE_URL } from './const';
import { SlackSecrets } from './types';

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

export const getSlackAppSecrets = async (): Promise<SlackSecrets> => {
  var params: GetParametersRequest = {
    Names: [
      '/techpivot/streaming-slack-notify/prod/slack/client_id',
      '/techpivot/streaming-slack-notify/prod/slack/client_secret',
      '/techpivot/streaming-slack-notify/prod/slack/signing_secret',
    ],
    WithDecryption: true,
  };

  const response: GetParametersResult = await ssm.getParameters(params).promise();
  const result: any = {};

  (response.Parameters || []).forEach(({ Name, Value }) => {
    var namePieces: string[] = (Name || '').split('/');
    if (namePieces.length > 0) {
      result[namePieces[namePieces.length - 1]] = Value;
    }
  });

  return result;
};

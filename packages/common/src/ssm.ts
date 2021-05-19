import { config, SSM, ECSCredentials } from 'aws-sdk';
import { GetParameterResult, GetParametersRequest, GetParametersResult } from 'aws-sdk/clients/ssm';
import {
  REGION,
  SSM_GITHUB_APP_CLIENT_SECRET,
  SSM_GITHUB_APP_PRIVATE_KEY,
  SSM_PARAMETER_QUEUE_URL,
  SSM_GITHUB_APP_WEBHOOK_SECRET,
  SSM_SLACK_APP_CLIENT_ID,
  SSM_SLACK_APP_CLIENT_SECRET,
  SSM_SLACK_APP_SIGNING_SECRET,
  SSM_FAUNADB_SERVER_SECRET,
} from './const';
import { SlackSecrets } from './types';

const ssm = new SSM({
  region: REGION,
  credentials:
    process.env.AWS_EXECUTION_ENV === 'AWS_ECS_EC2'
      ? new ECSCredentials({
          httpOptions: { timeout: 5000 },
          maxRetries: 3,
        })
      : undefined,
});

console.log('TESTing AWS credentials', config.credentials);


let queueUrl = '';
let gitHubAppClientSecret = '';
let gitHubAppWebhookSecret = '';
let gitHubAppPrivateKey = '';
let slackSigningSecret = '';
let faunaDbServerSecret = '';

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
    console.log('AA');
    // Lastly, pull from SSM
    const response: GetParameterResult = await ssm
      .getParameter({
        Name: SSM_PARAMETER_QUEUE_URL,
        WithDecryption: true,
      })
      .promise();

    console.log('BB');
    if (!response.Parameter) {
      throw new Error('Successfully queried parameter store but no Parameter was received');
    }

    console.log('CC');
    if (!response.Parameter.Value) {
      throw new Error('Successfully queried parameter store but no Parameter value was received');
    }

    console.log('DD');
    queueUrl = response.Parameter.Value;
  }

  return queueUrl;
};

export const getAllSlackAppSecrets = async (): Promise<SlackSecrets> => {
  const params: GetParametersRequest = {
    Names: [SSM_SLACK_APP_CLIENT_ID, SSM_SLACK_APP_CLIENT_SECRET, SSM_SLACK_APP_SIGNING_SECRET],
    WithDecryption: true,
  };

  const response: GetParametersResult = await ssm.getParameters(params).promise();
  const result: { [key: string]: string } = {};

  (response.Parameters || []).forEach(({ Name, Value }) => {
    const namePieces: string[] = (Name || '').split('/');
    if (namePieces.length > 0 && Value !== undefined) {
      result[namePieces[namePieces.length - 1].replace('-', '_')] = Value;
    }
  });

  return result as SlackSecrets;
};

export const getSlackSigningSecret = async (): Promise<string> => {
  if (slackSigningSecret !== '') {
    return slackSigningSecret;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_SLACK_APP_SIGNING_SECRET,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  slackSigningSecret = response.Parameter.Value;

  return slackSigningSecret;
};

export const getGitHubAppClientSecret = async (): Promise<string> => {
  if (gitHubAppClientSecret !== '') {
    return gitHubAppClientSecret;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_GITHUB_APP_CLIENT_SECRET,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  gitHubAppClientSecret = response.Parameter.Value;

  return gitHubAppClientSecret;
};

export const getGitHubAppPrivateKey = async (): Promise<string> => {
  if (gitHubAppPrivateKey !== '') {
    return gitHubAppPrivateKey;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_GITHUB_APP_PRIVATE_KEY,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  gitHubAppPrivateKey = response.Parameter.Value;

  return gitHubAppPrivateKey;
};

export const getGitHubAppWebhookSecret = async (): Promise<string> => {
  if (gitHubAppWebhookSecret !== '') {
    return gitHubAppWebhookSecret;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_GITHUB_APP_WEBHOOK_SECRET,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  gitHubAppWebhookSecret = response.Parameter.Value;

  return gitHubAppWebhookSecret;
};

export const getFaunadbServerSecret = async (): Promise<string> => {
  if (faunaDbServerSecret !== '') {
    return faunaDbServerSecret;
  }

  const response: GetParameterResult = await ssm
    .getParameter({
      Name: SSM_FAUNADB_SERVER_SECRET,
      WithDecryption: true,
    })
    .promise();

  if (!response.Parameter) {
    throw new Error('Successfully queried parameter store but no Parameter was received');
  }

  if (!response.Parameter.Value) {
    throw new Error('Successfully queried parameter store but no Parameter value was received');
  }

  faunaDbServerSecret = response.Parameter.Value;

  return faunaDbServerSecret;
};

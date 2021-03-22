import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { OAuthV2AccessArguments, WebClient } from '@slack/web-api';
import { parseTemplate } from './utils';
import { insertSlackRecord } from '../../common/lib/dynamodb';
import { generateReadableSlackError, ValidationError, BaseError } from '../../common/lib/errors';
import { getAllSlackAppSecrets } from '../../common/lib/ssm';
import { SlackSecrets, SlackApiOauthV2AccessResponseData } from '../../common/lib/types';

const init = async (): Promise<SlackSecrets> => {
  return new Promise((resolve) => {
    resolve(getAllSlackAppSecrets());
  });
};
const initPromise: Promise<SlackSecrets> = init();

export const handler = async (event: APIGatewayProxyEvent /*, context: Context */): Promise<APIGatewayProxyResult> => {
  let statusCode: number = 200;
  let responseBody: string = '';

  try {
    // Note: No need to verify request signature as this is apart of the subsequent call
    const { queryStringParameters } = event;

    if (!queryStringParameters || !queryStringParameters.code) {
      throw new ValidationError('No "code" query parameter specified.');
    }

    const { client_id, client_secret } = await initPromise;

    // Exchange code for token
    // Reference: https://api.slack.com/methods/oauth.v2.access
    const client = new WebClient();
    const options: OAuthV2AccessArguments = {
      client_id,
      client_secret,
      code: queryStringParameters.code,
    };

    let response;
    try {
      response = (await client.oauth.v2.access(options)) as SlackApiOauthV2AccessResponseData;
    } catch (error) {
      console.error(error);
      throw generateReadableSlackError(error);
    }

    const token = await insertSlackRecord(response);
    console.log(`Generated token [${token}] for team ID: ${response.team.id}`);

    responseBody = parseTemplate('success.html', {
      token,
    });
  } catch (error) {
    // Log the full error in CloudWatch
    console.error(error);

    // If the error is one of our errors, display appropriately; Otherwise, throw 500
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
    } else {
      statusCode = 500;
    }
    responseBody = parseTemplate('error.html', {
      errorMessage: error.message || 'Unknown',
      errorType: error.name || error.code || 'Unknown error type',
    });
  }
  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      Server: 'TechPivot',
      'Content-Type': 'text/html',
    },
    body: responseBody,
  };
};

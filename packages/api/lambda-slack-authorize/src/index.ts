import { OAuthV2AccessArguments, WebClient } from '@slack/web-api';
import { BadRequest, BaseError } from './errors';
import { Context, Event, OauthV2AccessResponse } from './types';
import { generateReadableSlackError, getSlackSecrets, parseTemplate, saveOauthV2AccessResponse } from './utils';

export const handler = async (event: Event, context: Context): Promise<any> => {
  let statusCode: number = 200;
  let body: string = '';
  const isBase64Encoded: boolean = false;
  const cookies: string[] = [];
  const headers = {
    Server: 'TechPivot',
    'Content-Type': 'text/html',
  };

  try {
    // Parse the region from context since we don't have Regions global mocked locally
    if (!context || !context['invokedFunctionArn']) {
      throw new BadRequest('Invalid context payload.');
    }

    if (!event.queryStringParameters || !event.queryStringParameters.code) {
      throw new BadRequest('No "code" query parameter specified.');
    }

    const region = context['invokedFunctionArn'].split(':')[3];
    const { client_id, client_secret, signing_secret } = await getSlackSecrets(region);

    // Exchange code for token
    // Reference: https://api.slack.com/methods/oauth.v2.access
    const client = new WebClient();
    const options: OAuthV2AccessArguments = {
      client_id,
      client_secret,
      code: event.queryStringParameters.code,
    };

    let response;
    try {
      response = (await client.oauth.v2.access(options)) as OauthV2AccessResponse;
    } catch (error) {
      console.error('======== Original Error ========');
      console.error(error);
      throw generateReadableSlackError(error);
    }

    const token = await saveOauthV2AccessResponse(region, response);
    console.log(`Generated token [${token}] for team ID: ${response.team.id}`);

    statusCode = 200;
    body = parseTemplate('success.html', {
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
    body = parseTemplate('error.html', {
      errorMessage: error.message || 'Unknown',
      errorType: error.name || error.code || 'Unknown error type',
    });
  } finally {
    const { DEVELOPMENT } = process.env;

    if (DEVELOPMENT === 'true') {
      return {
        statusCode,
      };
    }

    return {
      statusCode,
      isBase64Encoded,
      cookies,
      headers,
      body,
    };
  }
};

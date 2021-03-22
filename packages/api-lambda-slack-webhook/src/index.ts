import { APIGatewayProxyEvent, APIGatewayEventRequestContext, APIGatewayProxyResult } from 'aws-lambda';
import { verifyRequestSignature } from '@slack/events-api';
import { BaseError, ValidationError } from '../../common/lib/errors';
import { getSlackSigningSecret } from '../../common/lib/ssm';
import { deleteSlackRecordById } from '../../common/lib/dynamodb';

const init = async (): Promise<string> => {
  return new Promise((resolve) => {
    resolve(getSlackSigningSecret());
  });
};
const initPromise: Promise<string> = init();

export const handler = async (
  event: APIGatewayProxyEvent,
  context: APIGatewayEventRequestContext
): Promise<APIGatewayProxyResult> => {
  let statusCode = 200;
  let responseBody: any = {};

  try {
    if (event.body === null) {
      throw new ValidationError('No post data received');
    }

    console.log('event', event);
    console.log('context', context);

    const { headers } = event;
    const eventBody = JSON.parse(event.body);

    try {
      verifyRequestSignature({
        signingSecret: await initPromise,
        requestSignature: headers['x-slack-signature'] || '',
        requestTimestamp: parseInt(headers['x-slack-request-timestamp'] || ''),
        body: event.body,
      });
    } catch (error) {
      throw new ValidationError('Invalid Slack signature');
    }

    switch (eventBody.type) {
      case 'url_verification':
        console.log('Responding with application challenge');
        responseBody.challenge = eventBody.challenge;
        break;

      case 'event_callback':
        switch (eventBody.event.type) {
          case 'app_uninstalled':
            console.log('Removing Slack app registration: ', eventBody.api_app_id);
            await deleteSlackRecordById(eventBody.api_app_id);
            break;
        }
        break;
    }
  } catch (error) {
    // Log the full error in CloudWatch
    console.error(error);

    // If the error is one of our errors, display appropriately; Otherwise, throw 200
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
    } else {
      console.debug('Resetting return status code to 200 even though an error occurred');
      statusCode = 200;
    }
  }

  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      Server: 'TechPivot',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(responseBody),
  };
};

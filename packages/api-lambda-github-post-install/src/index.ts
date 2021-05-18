/**
 * This script handles when an authorized GitHub app registration takes place. After any install/update the app
 * will redirect to and endpoint that queries this lambda. The goal is to:
 *
 * 1) Set the streaming slack APP ID for the current github installation_id.
 * 2) Set the slack channel
 * 3) set the bot username
 *
 * Sample Post-Install URL from GitHub
 *   https://api.streaming-slack-notify.techpivot.com/github/post-install?installation_id=16347593&setup_action=install
 */

import { APIGatewayProxyEventV2, APIGatewayProxyHandlerV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { getHandler } from './handler-get';
import { postHandler } from './handler-post';

export const handler: APIGatewayProxyHandlerV2 = async (
  event: APIGatewayProxyEventV2
): Promise<APIGatewayProxyResultV2> => {
  switch (event.requestContext.http.method.toUpperCase()) {
    case 'GET':
      return getHandler(event);

    case 'POST':
      return postHandler(event);

    default:
      return {
        statusCode: 500,
        isBase64Encoded: false,
        headers: {
          Server: 'TechPivot',
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(`Endpoint doesn't support HTTP method: ${event.requestContext.http.method}`),
      };
  }
};

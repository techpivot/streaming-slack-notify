import { createHmac, timingSafeEqual } from 'crypto';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { InstallationEvent } from '@octokit/webhooks-definitions/schema';
import { BaseError, ValidationError } from '../../common/lib/errors';
import { insertGithubAppWebhookRecord } from '../../common/lib/dynamodb';
import { getGitHubAppWebhookSecret } from '../../common/lib/ssm';

export const handler = async (event: APIGatewayProxyEvent /*, context: Context */): Promise<APIGatewayProxyResult> => {
  let statusCode = 200;
  const body = {
    ok: true,
  };

  try {
    if (event.body === null) {
      throw new ValidationError('No post data received');
    }

    // Ensure some basic Github headers
    const { headers } = event;

    if (headers['x-github-event'] === undefined) {
      throw new ValidationError('No valid "x-github-event" header specified');
    }

    if (headers['x-hub-signature'] === undefined) {
      throw new ValidationError('No valid "x-hub-signature" header specified');
    }

    console.log('Verifying signature webhook signature...');
    const hmac = createHmac('sha1', await getGitHubAppWebhookSecret());
    const digest = Buffer.from('sha1=' + hmac.update(event.body).digest('hex'), 'utf8');
    const checksum = Buffer.from(headers['x-hub-signature'], 'utf8');

    if (checksum.length !== digest.length || !timingSafeEqual(digest, checksum)) {
      throw new Error(`Request body digest (${digest}) did not match x-hub-signature (${checksum})`);
    }

    console.log('Handling webhook for event:', headers['x-github-event']);

    // Good, signature verified. We store the installation ID alongside the owner such that we can quickly
    // retrieve the installation ID and verify synchronization between owner and installation ID.

    switch (headers['x-github-event']) {
      case 'installation':
        const jsonBody = JSON.parse(event.body) as InstallationEvent;
        const {
          action,
          installation: {
            id: installationId,
            account: { login: owner, type, id: accountId },
          },
          sender: { login: senderLogin, id: senderId },
        } = jsonBody;

        console.log('Inserting webhook for event:', headers['x-github-event']);
        await insertGithubAppWebhookRecord(owner, type, accountId, installationId, action, senderLogin, senderId);
        break;

      default:
        console.log('Ignoring event');
        break;
    }
  } catch (error) {
    // If the error is one of our errors, display appropriately; Otherwise, throw 500
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
    } else {
      statusCode = 500;
    }

    // Log the full error in CloudWatch
    console.error(error);
    console.error('Returning with statusCode: ' + statusCode);

    body.ok = false;
  }

  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      Server: 'TechPivot',
      'Content-Type': 'text/javascript',
    },
    body: JSON.stringify(body),
  };
};

import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BaseError, ValidationError } from '../../common/lib/errors';
import { getSlackRecordById, updateGithubAppRecordFromPostInstallSettings } from '../../common/lib/dynamodb';

export const postHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let statusCode = 200;
  const response: { action?: string; error?: string } = {};

  try {
    if (event.body === undefined) {
      throw new ValidationError('No post data received');
    }

    const body = JSON.parse(event.body);

    if (!body.installationId) {
      throw new ValidationError('No "installationId" parameter');
    }
    if (!body.slackAppId) {
      throw new ValidationError('No "slackAppId" parameter');
    }
    if (!body.slackChannel) {
      throw new ValidationError('No "slackChannel" parameter');
    }

    // Validate the slack app ID
    const slackAppRecord = await getSlackRecordById(body.slackAppId);
    if (!slackAppRecord.Item) {
      throw new ValidationError(
        'The specified Slack App ID is invalid or no longer valid. Visit https://github.com/techpivot/streaming-slack-notify to properly install the Streaming Slack Notify service.'
      );
    }

    // Good, now update the GitHub record with proper settings
    console.log('Attempting to update GitHub record', body);
    const { installationId, slackAppId, slackChannel, slackBotUsername } = body;
    await updateGithubAppRecordFromPostInstallSettings(
      parseInt(installationId),
      slackAppId,
      slackChannel,
      slackBotUsername
    );

    response.action = 'ok';
  } catch (error) {
    // Log the full error in CloudWatch
    console.error(error);

    // If the error is one of our errors, display appropriately; Otherwise, throw 500
    if (error instanceof BaseError) {
      statusCode = error.getStatusCode();
      response.error = error.message;
    } else {
      statusCode = 500;
      response.error = error.message;
    }
  }

  return {
    statusCode,
    isBase64Encoded: false,
    headers: {
      Server: 'TechPivot',
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(response),
  };
};

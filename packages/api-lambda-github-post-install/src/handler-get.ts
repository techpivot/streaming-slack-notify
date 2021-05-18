import { APIGatewayProxyEventV2, APIGatewayProxyResultV2 } from 'aws-lambda';
import { BaseError, sanitizeErrorForTemplates, ValidationError } from '../../common/lib/errors';
import { getGithubRecordById } from '../../common/lib/dynamodb';
import { parseTemplate, sleep } from '../../common/lib/utils';

export const getHandler = async (event: APIGatewayProxyEventV2): Promise<APIGatewayProxyResultV2> => {
  let statusCode = 200;
  let responseBody = '';

  try {
    const { queryStringParameters } = event;

    if (
      !queryStringParameters ||
      !queryStringParameters.installation_id ||
      queryStringParameters.installation_id === undefined
    ) {
      throw new ValidationError('No "installation_id" query parameter specified.');
    }
    if (
      !queryStringParameters ||
      !queryStringParameters.setup_action ||
      queryStringParameters.setup_action === undefined
    ) {
      throw new ValidationError('No "setup_action" query parameter specified.');
    }

    const { installation_id: installationId, setup_action: setupAction } = queryStringParameters;

    console.log('Retrieving GitHub post installation page for installation ID', installationId);

    const isInstalling = setupAction.toLowerCase() === 'install';
    let slackAppRecord;
    let count = 0;

    // eslint-disable-next-line no-constant-condition
    while (true) {
      count++;

      // Validate the GitHub installation ID. Note that we use a strongly consistent read here. This is important
      // since the previous authorization webhook that takes place just milliseconds prior to this does not leave
      // enough time to perform an eventually consistent read. Note that it appears these may come out of order. Thus,
      // if this an install event, delay slightly.
      if (isInstalling) {
        sleep(2500);
      }

      slackAppRecord = await getGithubRecordById(parseInt(installationId, 10), true);
      if (slackAppRecord.Item) {
        break;
      }

      if (!isInstalling || count >= 2) {
        // Attempt to sleep once more
        throw new ValidationError('The specified GitHub Installation ID is invalid or no longer valid.');
      }
    }

    // Great. Render the post-install template with the values for Slack App ID, Channel, Bot Username (Note: These may be empty)
    const {
      Item: { slack_app_id: slackAppId, slack_bot_username: slackBotUsername, slack_channel: slackChannel },
    } = slackAppRecord;

    responseBody = parseTemplate('index.html', {
      installationId,
      slackAppId: slackAppId || '',
      slackChannel: slackChannel || '',
      slackBotUsername: slackBotUsername || '',
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
      errorMessage: sanitizeErrorForTemplates(error.message) || 'Unknown',
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

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import { getRecordById } from '../../common/lib/dynamodb';
import { BaseError, ValidationError } from '../../common/lib/errors';
import { addToQueue } from '../../common/lib/sqs';
import {
  ApiGithubActionResponseData,
  ApiGithubActionRequestData,
  ApiGithubActionRequestDataV,
  SQSBody,
} from '../../common/lib/types';

export const handler = async (event: APIGatewayProxyEvent /*, context: Context */): Promise<APIGatewayProxyResult> => {
  let statusCode = 200;
  const body: ApiGithubActionResponseData = {
    ok: true,
  };

  try {
    if (event.body === null) {
      throw new ValidationError('No post data received');
    }

    const jsonBody = JSON.parse(event.body);

    const result = ApiGithubActionRequestDataV.decode(jsonBody);

    if (isLeft(result)) {
      throw new ValidationError(PathReporter.report(result).join('\n'));
    }

    const validJsonBody = jsonBody as ApiGithubActionRequestData;

    const { channel, username, iconUrl, iconEmoji, appToken } = validJsonBody;

    // Ensure the application token exists
    console.time('DynamoDB Time');
    const record = await getRecordById(appToken);
    console.timeEnd('DynamoDB Time');

    const sqsBody: SQSBody = {
      slack: {
        channel,
        username,
        iconUrl,
        iconEmoji,
        ...record,
      },
      github: validJsonBody.github,
      githubToken: validJsonBody.githubToken,
    };

    // Add to queue which will be picked up by poller
    console.time('SQS Time');
    await addToQueue(sqsBody);
    console.timeEnd('SQS Time');

    // All done!
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
    body.error = {
      message: error.message || error,
      name: error.name,
    };
  } finally {
    return {
      statusCode,
      isBase64Encoded: false,
      headers: {
        Server: 'TechPivot',
        'Content-Type': 'text/javascript',
      },
      body: JSON.stringify(body),
    };
  }
};

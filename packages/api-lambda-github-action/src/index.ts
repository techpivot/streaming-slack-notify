import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import { createAppAuth } from '@octokit/auth';
import { Octokit } from '@octokit/rest';
import { GITHUB_APP_ID } from '../../common/lib/const';
import { getSlackRecordById, getGitHubInstallationId } from '../../common/lib/dynamodb';
import { BaseError, GitHubAppValidationError, ValidationError } from '../../common/lib/errors';
import { getGitHubAppPrivateKey } from '../../common/lib/ssm';
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

    const {
      channel,
      username,
      iconUrl,
      iconEmoji,
      appToken,
      github: {
        repository: { owner, repo },
      },
    } = validJsonBody;

    // Validate that we can retrieve an installation ID
    console.time('DynamoDB Time [getGitHubInstallationId]');
    const githubInstallationId = await getGitHubInstallationId(owner);
    console.timeEnd('DynamoDB Time [getGitHubInstallationId]');

    console.log('Found GitHub installation ID:', githubInstallationId);

    // Validate the actual GitHub installation ID
    try {
      console.time('GitHub octokit client app auth:');

      const octokit = new Octokit({
        authStrategy: createAppAuth,
        auth: {
          id: GITHUB_APP_ID,
          privateKey: await getGitHubAppPrivateKey(),
          installationId: githubInstallationId,
        },
      });
      console.timeEnd('GitHub octokit client app auth:');

      // If we have an active rest API client, attempt to retrieve workflow runs (verifies we have permissions)

      console.time('GitHub verify workflow actions');
      const workflowResult = await octokit.actions.listWorkflowRunsForRepo({
        owner,
        repo,
        page: 1,
        per_page: 1,
      });
      console.timeEnd('GitHub verify workflow actions');

      if ([200, 204].includes(workflowResult.status) === false) {
        throw new Error(`Invalid status code for listWorkflowRunsForRepo: ${workflowResult.status}`);
      }
    } catch (error) {
      throw new GitHubAppValidationError(
        `Unable to read GitHub action data for repo: ${owner}/${repo}. Ensure the current account ${owner} has the GitHub application installed and the ${repo} repository is included in the permission set. ${error.message}`
      );
    }

    // Ensure the Slack application token exists
    console.time('DynamoDB Time [getSlackRecordById]');
    const record = await getSlackRecordById(appToken);
    console.timeEnd('DynamoDB Time [getSlackRecordById]');

    const sqsBody: SQSBody = {
      slack: {
        channel,
        username,
        iconUrl,
        iconEmoji,
        ...record,
      },
      github: validJsonBody.github,
      githubInstallationId,
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

import { DynamoDB } from 'aws-sdk';
import { REGION, DYNAMODB_SLACK_TABLE_NAME, DYNAMODB_GITHUB_TABLE_NAME } from './const';
import { DynamoDBGitHubGetItemOutput, DynamoDBSlackGetItemOutput, SlackApiOauthV2AccessResponseData } from './types';

const dynamodb = new DynamoDB.DocumentClient({ region: REGION });

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TABLE: SLACK
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Store result in DynamoDB. Really no need to store one team_id per id as if any Slack
 * workspace decides to revoke and re-install this is minimal and our table structure is
 * minimal. We have a small GSI on team_id if we need to do some checking on other areas
 * of the app.
 */
export const insertSlackAccessResponseRecord = async (response: SlackApiOauthV2AccessResponseData): Promise<void> => {
  await dynamodb
    .put({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Item: {
        api_app_id: response.app_id,
        team_id: response.team.id,
        team_name: response.team.name,
        created_at: new Date().toISOString(),
        scope: response.scope,
        token_type: response.token_type,
        access_token: response.access_token,
        bot_user_id: response.bot_user_id,
      },
    })
    .promise();
};

export const getSlackRecordById = async (apiAppId: string): Promise<DynamoDBSlackGetItemOutput> => {
  return (await dynamodb
    .get({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Key: { api_app_id: apiAppId },
    })
    .promise()) as DynamoDBSlackGetItemOutput;
};

export const deleteSlackRecordById = async (apiAppId: string): Promise<void> => {
  await dynamodb
    .delete({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Key: { api_app_id: apiAppId },
    })
    .promise();
};

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// TABLE: GITHUB
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export const getGithubRecordById = async (
  installationId: number,
  stronglyConsistent: boolean = false
): Promise<DynamoDBGitHubGetItemOutput> => {
  return (await dynamodb
    .get({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Key: { installation_id: installationId },
      ConsistentRead: stronglyConsistent,
    })
    .promise()) as DynamoDBGitHubGetItemOutput;
};

export const deleteGitHubRecordById = async (installationId: number): Promise<void> => {
  await dynamodb
    .delete({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Key: { installation_id: installationId },
    })
    .promise();
};

export const updateGithubAppRecordFromWebhook = async (
  installationId: number,
  owner: string,
  type: string,
  accountId: number,
  senderLogin: string,
  senderId: number
): Promise<void> => {
  await dynamodb
    .update({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Key: { installation_id: installationId },
      UpdateExpression:
        'set #ua = :updated_at, #o = :owner, #t = :type, #ai = :account_id, #sl = :sender_login, #si = :sender_id',
      ExpressionAttributeNames: {
        '#ua': 'updated_at',
        '#o': 'owner',
        '#t': 'type',
        '#ai': 'account_id',
        '#sl': 'sender_login',
        '#si': 'sender_id',
      },
      ExpressionAttributeValues: {
        ':updated_at': new Date().toISOString(),
        ':owner': owner,
        ':type': type,
        ':account_id': accountId,
        ':sender_login': senderLogin,
        ':sender_id': senderId,
      },
    })
    .promise();
};

/**
 * Updates the GitHub record with coalesced post-install Slack settings. If the GitHub installation does not exist
 * this will throw an error.
 *
 * @param installationId
 * @param slackAppId
 * @param slackChannel
 * @param slackBotUsername
 * @returns
 */
export const updateGithubAppRecordFromPostInstallSettings = async (
  installationId: number,
  slackAppId: string,
  slackChannel: string,
  slackBotUsername?: string
): Promise<void> => {
  await dynamodb
    .update({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Key: { installation_id: installationId },
      UpdateExpression: 'set #sa = :slackAppId, #sc = :slackChannel, #sb = :slackBotUsername',
      ExpressionAttributeNames: {
        '#sa': 'slack_app_id',
        '#sc': 'slack_channel',
        '#sb': 'slack_bot_username',
      },
      ExpressionAttributeValues: {
        ':slackAppId': slackAppId,
        ':slackChannel': slackChannel,
        ':slackBotUsername': slackBotUsername,
      },
      ConditionExpression: 'attribute_exists(installation_id)',
    })
    .promise();
};

/*
export const getSlackRecordById = async (id: string): Promise<DynamoDbGetRecordItem> => {
  const result: DocumentClient.GetItemOutput = await dynamodb
    .get({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Key: { api_app_id: id },
      ProjectionExpression: 'api_app_id, access_token, team_name, team_id',
    })
    .promise();

  const { Item } = result;
  if (!Item) {
    throw new NotFoundError(`Unable to retrieve Slack record for api app id: ${id}  (Non-existent)`);
  }

  return {
    teamName: Item.team_name,
    teamId: Item.team_id,
    id,
    accessToken: Item.access_token,
  };
};
*/

/*

@todo new table `workflow-runs`   with `github_installation_id` | workflow_run_count | updated_at

export const incrementWorkflowRunCount = async (id: string, amount = 1): Promise<void> => {
  await dynamodb
    .update({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set workflow_run_count = workflow_run_count + :val',
      ExpressionAttributeValues: { ':val': amount },
    })
    .promise();
};
*/
/*
export const getGitHubInstallationId = async (owner: string): Promise<number> => {
  const result: DocumentClient.QueryOutput = await dynamodb
    .query({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      KeyConditionExpression: `#owner = :value`,
      ExpressionAttributeNames: {
        '#owner': 'owner',
      },
      ExpressionAttributeValues: {
        ':value': owner,
      },
      ProjectionExpression: 'installation_id',
      Limit: 1,
      ScanIndexForward: false,
      ConsistentRead: false,
    })
    .promise();

  const { Items } = result;

  if (Items === undefined || Items.length === 0) {
    throw new NotFoundError(
      `Unable to find a GitHub installation ID associated with account: ${owner}  Ensure the GitHub app is properly installed via GitHub`
    );
  }

  return Items[0]['installation_id'];
};
 */

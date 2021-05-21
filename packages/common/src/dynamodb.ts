import { DynamoDB } from 'aws-sdk';
import { REGION, DYNAMODB_SLACK_TABLE_NAME, DYNAMODB_GITHUB_TABLE_NAME } from './const';
import { DynamoDBGitHubGetItemOutput, DynamoDBSlackGetItemOutput, SlackApiOauthV2AccessResponseData } from './types';

let dynamodb: any = new DynamoDB.DocumentClient({ region: REGION });

const getDynamodb = (): DynamoDB.DocumentClient => {
  if (dynamodb === null) {
    dynamodb = new DynamoDB.DocumentClient({ region: REGION });
  }

  return dynamodb;
};

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
  await getDynamodb()
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
  return (await getDynamodb()
    .get({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Key: { api_app_id: apiAppId },
    })
    .promise()) as DynamoDBSlackGetItemOutput;
};

export const deleteSlackRecordById = async (apiAppId: string): Promise<void> => {
  await getDynamodb()
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
  stronglyConsistent = false
): Promise<DynamoDBGitHubGetItemOutput> => {
  return (await getDynamodb()
    .get({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Key: { installation_id: installationId },
      ConsistentRead: stronglyConsistent,
    })
    .promise()) as DynamoDBGitHubGetItemOutput;
};

export const deleteGitHubRecordById = async (installationId: number): Promise<void> => {
  await getDynamodb()
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
  await getDynamodb()
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
  await getDynamodb()
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

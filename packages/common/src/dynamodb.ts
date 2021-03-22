import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { REGION, DYNAMODB_SLACK_TABLE_NAME, DYNAMODB_GITHUB_TABLE_NAME } from './const';
import { NotFoundError } from './errors';
import { DynamoDbGetRecordItem, SlackApiOauthV2AccessResponseData } from './types';

const dynamodb = new DynamoDB.DocumentClient({ region: REGION });

/**
 * Store result in DynamoDB. Really no need to store one team_id per id as if any Slack
 * workspace decides to revoke and re-install this is minimal and our table structure is
 * minimal. We have a small GSI on team_id if we need to do some checking on other areas
 * of the app.
 */
export const insertSlackRecord = async (response: SlackApiOauthV2AccessResponseData): Promise<any> => {
  const timestamp: string = new Date().toISOString();

  await dynamodb
    .put({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Item: {
        api_app_id: response.app_id,
        team_id: response.team.id,
        team_name: response.team.name,
        created_at: timestamp,
        scope: response.scope,
        token_type: response.token_type,
        access_token: response.access_token,
        bot_user_id: response.bot_user_id,
      },
    })
    .promise();

  return response.app_id;
};

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

export const deleteSlackRecordById = async (id: string): Promise<void> => {
  await dynamodb
    .delete({
      TableName: DYNAMODB_SLACK_TABLE_NAME,
      Key: { api_app_id: id },
    })
    .promise();
};

/*

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

export const insertGithubAppWebhookRecord = async (
  owner: string,
  type: string,
  accountId: number,
  installationId: number,
  action: string,
  senderLogin: string,
  senderId: number
): Promise<any> => {
  const timestamp: string = new Date().toISOString();

  await dynamodb
    .put({
      TableName: DYNAMODB_GITHUB_TABLE_NAME,
      Item: {
        owner,
        updated_at: timestamp,
        installation_id: installationId,
        account_id: accountId,
        action,
        type,
        sender_login: senderLogin,
        sender_id: senderId,
      },
    })
    .promise();

  return owner;
};

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

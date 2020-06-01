import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { v4 as uuidv4 } from 'uuid';
import { REGION, DYNAMODB_TABLE_NAME } from './const';
import { NotFoundError } from './errors';
import { DynamoDbGetRecordItem } from './types';

const dynamodb = new DynamoDB.DocumentClient({ region: REGION });

/**
 * Store result in DynamoDB. Really no need to store one team_id per id as if any Slack
 * workspace decides to revoke and re-install this is minimal and our table structure is
 * minimal. We have a small GSI on team_id if we need to do some checking on other areas
 * of the app.
 */
export const insertRecord = async (response: any): Promise<any> => {
  const timestamp: string = new Date().toISOString();
  const uuid: string = uuidv4();

  await dynamodb
    .put({
      TableName: DYNAMODB_TABLE_NAME,
      Item: {
        id: uuid,
        team_id: response.team.id,
        team_name: response.team.name,
        created_at: timestamp,
        app_id: response.app_id,
        scope: response.scope,
        token_type: response.token_type,
        access_token: response.access_token,
        bot_user_id: response.bot_user_id,
        workflow_run_count: 0,
        last_workflow_date: '',
      },
    })
    .promise();

  return uuid;
};

export const getRecordById = async (id: string): Promise<DynamoDbGetRecordItem> => {
  const result: DocumentClient.GetItemOutput = await dynamodb
    .get({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { id: id },
      ProjectionExpression: 'id, access_token, team_name, team_id',
    })
    .promise();

  const { Item } = result;
  if (!Item) {
    throw new NotFoundError(`Unable to retrieve database record for token id: ${id}:`);
  }

  return {
    teamName: Item.team_name,
    teamId: Item.team_id,
    id,
    accessToken: Item.access_token,
  };
};

export const incrementWorkflowRunCount = async (id: string, amount: number = 1): Promise<void> => {
  await dynamodb
    .update({
      TableName: DYNAMODB_TABLE_NAME,
      Key: { id },
      UpdateExpression: 'set workflow_run_count = workflow_run_count + :val',
      ExpressionAttributeValues: { ':val': amount },
    })
    .promise();
};

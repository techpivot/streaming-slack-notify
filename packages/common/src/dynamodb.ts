import { DynamoDB } from 'aws-sdk';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';
import { REGION, DYNAMODB_TABLE_NAME } from './const';
import { NotFoundError } from './errors';
import { DynamoDbGetRecordItem } from './types';

const dynamodb = new DynamoDB.DocumentClient({ region: REGION });

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

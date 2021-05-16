import * as t from 'io-ts';
import { WebAPICallResult } from '@slack/web-api';
import { DocumentClient } from 'aws-sdk/clients/dynamodb';

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// DynamoDB
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export interface DynamoDBGitHubGetItemOutput extends Omit<DocumentClient.GetItemOutput, 'Item'> {
  Item?: {
    installation_id: number;
    account_id: string;
    owner: string;
    sender_id: number;
    sender_login: string;
    type: string;
    updated_at: string;
    // The following fields are injected at GitHub post-install settings
    slack_app_id?: string;
    slack_bot_username?: string;
    slack_channel?: string;
  };
}

export interface DynamoDBSlackGetItemOutput extends Omit<DocumentClient.GetItemOutput, 'Item'> {
  Item?: {
    api_id_id: string;
    access_token: string;
    bot_user_id: 'bot';
    created_at: string;
    scope: string;
    team_id: string;
    team_name: string;
    token_type: string;
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// Slack
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

export type SlackSecrets = {
  client_id: string;
  client_secret: string;
  signing_secret: string;
};

export interface SlackApiOauthV2AccessResponseData extends WebAPICallResult {
  app_id: string;
  authed_user: {
    id: string;
  };
  scope: string;
  token_type: 'bot';
  access_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
}

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SQS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Since the server never queries DynamoDB (the Lambda will ensure the record exists and pluck the
 * required data), it means we don't have to expose the tokenId again to the polling server.
 *
 */
export const SQSBodyV = t.intersection([
  // Required fields
  t.type({
    // The GitHub streaming slack notify app installation ID associated with the workflow event
    githubInstallationId: t.number,
    // Specifies the GitHub organization associated with the workflow event
    githubOrganization: t.string,
    // Specifies the GitHub repo associated with the workflow event
    githubRepository: t.string,
    // Specifies the GitHub workflow run ID to lookup
    githubWorkflowId: t.number,
    slackAppId: t.string,
    // The Slack channel for sending message
    slackChannel: t.string,
    // The Slack access token
    slackAccessToken: t.string,
  }),
  // Optional fields
  t.partial({
    // The Slack bot name. If not specified, uses the GitHub apps default name.
    slackBotUsername: t.string,
    // Slack Message timestamp of the original message for the workflow. Once a GitHub poller picks this up and
    // sends the first message, this will be added into the payload. Thus, if a spot instance needs to drain,
    // the message can get put back into the queue.
    slackTimestamp: t.string,
  }),
]);

export type SQSBody = t.TypeOf<typeof SQSBodyV>;

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
// GitHub
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

// A transform of  { WebhookPayload } @actions/github/lib/interfaces
const WebhookPayloadV = t.partial({});

export const GitHubWorkflowRunDataV = t.type({
  // GitHub Action payload. It's up to the caller to switch on the eventName and cast appropriately.
  // Currently need to refacor this to use the io-ts optional partials
  payload: WebhookPayloadV,
  // The name of the GitHub trigger event. (e.g. "push", "pull_request")
  eventName: t.string,
  // The name of the current GitHub workflow (e.g. "main")
  workflowName: t.string,
  // The GitHub action run id. Internally, GitHub is storing this as a number.
  runId: t.number,
  // The GitHub repository owner + repo. Technically, this is included in the payload for
  // most events; however, for some events it is not. Therefore, to better futureproof
  // we pluck this out of the payload to ensure that the action can send this where these
  // values are defined via environment variables.
  repository: t.type({
    owner: t.string,
    repo: t.string,
  }),
});

export type GitHubWorkflowRunData = t.TypeOf<typeof GitHubWorkflowRunDataV>;

/*
export const ApiGithubActionRequestDataV = t.intersection([
  t.type({
    // The Slack channel to stream GitHub actions logs to
    channel: t.string,
    // The GitHub workflow run data payload
    github: GitHubWorkflowRunDataV,
    // This is the TechPivot token ID we use to exchange for the secret slack_access_token stored securely. We
    // purposely don't use the legacy style "SLACK_ACCESS_TOKEN" verbiage to help prevent confusion.
    appToken: t.string,
  }),
  t.partial({
    username: t.string,
    iconUrl: t.string,
    iconEmoji: t.string,
  }),
]);

export type ApiGithubActionRequestData = t.TypeOf<typeof ApiGithubActionRequestDataV>;

export type ApiGithubActionResponseData = {
  ok: boolean;
  error?: {
    message: string;
    name: string;
  };
};

export type DynamoDbGetRecordItem = {
  id: string;
  teamName: string;
  teamId: string;
  accessToken: string;
};
*/

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

export const SlackTeamDataV = t.intersection([
  t.type({
    // The Slack channel for sending message
    channel: t.string,
    // The Slack access token
    accessToken: t.string,
    // The DynamoDB record ID. Resent in case this is needed for potentially updating the
    // record on the server side.
    id: t.string,
    // The name of the slack team
    teamName: t.string,
    // The ID of the slack team
    teamId: t.string,
  }),
  t.partial({
    // Slack Message timestamp of the original message for the workflow.
    ts: t.string,
    // Optional fields for first chat postMessage
    username: t.string,
    iconUrl: t.string,
    iconEmoji: t.string,
  }),
]);

export type SlackTeamData = t.TypeOf<typeof SlackTeamDataV>;

////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////
// SQS
////////////////////////////////////////////////////////////////////////////////////////////////////////////////////////

/**
 * Since the server never queries DynamoDB (the Lambda will ensure the record exists and pluck the
 * required data), it means we don't have to expose the tokenId again to the polling server.
 */
export const SQSBodyV = t.type({
  //github: GitHubWorkflowRunDataV,
  githubInstallationId: t.number,
  githubWorkflowRunId: t.number,
  slackAccessToken: SlackTeamDataV,
});

export type SQSBody = t.TypeOf<typeof SQSBodyV>;

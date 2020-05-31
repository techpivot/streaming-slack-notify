import * as t from 'io-ts';
import { WebhookPayload } from '@actions/github/lib/interfaces';

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
  // The GitHub action run id. Internally, GitHub is storing this as a number; however,
  // it seems likely they'll chnage it in the future. For now, we'll store as a string
  // and coerce where necessary for @oktokit-* API method type requirements.
  runId: t.string,
  // The GitHub repository owner + repo. Technically, this is included in the payload for
  // most events; however, for some events it is not. Therefore, to better futureproof
  // we pluck this out of the payload to ensure that the action can send this where these
  // values are defined via environment variables.
  repository: t.type({
    owner: t.string,
    repo: t.string,
  }),
});

export type GitHubWorkflowRunData = {
  // GitHub Action payload. It's up to the caller to switch on the eventName and cast appropriately.
  // Currently need to refacor this to use the io-ts optional partials
  payload: WebhookPayload;
  // The name of the GitHub trigger event. (e.g. "push", "pull_request")
  eventName: string;
  // The name of the current GitHub workflow (e.g. "main")
  workflowName: string;
  // The GitHub action run id. Internally, GitHub is storing this as a number; however,
  // it seems likely they'll chnage it in the future. For now, we'll store as a string
  // and coerce where necessary for @oktokit-* API method type requirements.
  runId: string;
  // The GitHub repository owner + repo. Technically, this is included in the payload for
  // most events; however, for some events it is not. Therefore, to better futureproof
  // we pluck this out of the payload to ensure that the action can send this where these
  // values are defined via environment variables.
  repository: {
    owner: string;
    repo: string;
  };
};

export type DynamoDbGetRecordItem = {
  teamName: string;
  teamId: string;
  id: string;
  accessToken: string;
};

export type SlackTeamData = {
  // The Slack channel for sending message
  channel: string;
  // The Slack access token
  accessToken: string;
  // The DynamoDB record ID. Resent in case this is needed for potentially updating the
  // record on the server side.
  id: string;
  // The name of the slack team
  teamName: string;
  // The ID of the slack team
  teamId: string;
  // Slack Message timestamp of the original message for the workflow.
  ts?: string;
  // Optional fields for first chat postMessage
  username?: string;
  iconUrl?: string;
  iconEmoji?: string;
};

export const ApiGithubActionRequestDataV = t.intersection([
  t.type({
    // The Slack channel to stream GitHub actions logs to
    channel: t.string,
    // The GitHub workflow run data payload
    github: GitHubWorkflowRunDataV,
    // This is the TechPivot token ID we use to exchange for the secret slack_access_token stored securely. We
    // purposely don't use the legacy style "SLACK_ACCESS_TOKEN" verbiage to help prevent confusion.
    appToken: t.string,
    // The GitHub {{github.token}} that is generated for each action which has API access.
    githubToken: t.string,
  }),
  t.partial({
    username: t.string,
    iconUrl: t.string,
    iconEmoji: t.string,
  })
]);

export type ApiGithubActionRequestData = t.TypeOf<typeof ApiGithubActionRequestDataV>;

export type ApiGithubActionResponseData = {
  ok: boolean;
  error?: {
    message: string;
    name: string;
  };
};

/**
 * Since the server never queries DynamoDB (the Lambda will ensure the record exists and pluck the
 * required data), it means we don't have to expose the tokenId again to the polling server.
 */
export type SQSBody = {
  github: GitHubWorkflowRunData;
  githubToken: string;
  slack: SlackTeamData;
};

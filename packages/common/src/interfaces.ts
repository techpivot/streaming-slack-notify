import { WebhookPayload } from '@actions/github/lib/interfaces';

export interface GitHubWorkflowRunData {
  // GitHub Action payload. It's up to the caller to switch on the eventName and cast appropriately.
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
}

export interface SlackTeamData {
  // The Slack channel for sending message
  channel: string;
  // The Slack access token
  accessToken: string;
  // The name of the slack team
  teamName: string;
  // The ID of the slack team
  teamId: string;
  // Slack Message timestamp of the original message for the workflow.
  messageTs?: string;
}

/**
 * Since the server never queries DynamoDB (the Lambda will ensure the record exists and pluck the
 * required data), it means we don't have to expose the tokenId again to the polling server.
 */
export interface SQSBody {
  github: GitHubWorkflowRunData;
  slack: SlackTeamData;
}

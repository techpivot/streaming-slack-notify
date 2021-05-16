import { Endpoints } from '@octokit/types';
import { WebAPICallResult } from '@slack/web-api';

export type GetWorkflowRunResponseData =
  Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}']['response']['data'];
export type ListJobsForWorkflowRunResponseData =
  Endpoints['GET /repos/{owner}/{repo}/actions/runs/{run_id}/jobs']['response']['data'];

export interface SlackChatPostMessageResponse extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

// this one isn't defined in schema yet
export type GithubActionsWorkflowJobConclusion =
  | null
  | 'skipped'
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required';

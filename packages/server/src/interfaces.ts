import { SQS } from 'aws-sdk';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData } from '@octokit/types';
import { GitHubWorkflowRunData } from '../../common/src/types';
import { WebAPICallResult } from '@slack/web-api';

export interface ConsumerOptions {
  queueUrl?: string;
  attributeNames?: string[];
  messageAttributeNames?: string[];
  stopped?: boolean;
  batchSize?: number;
  visibilityTimeout?: number;
  waitTimeSeconds?: number;
  authenticationErrorTimeout?: number;
  pollingWaitTimeMs?: number;
  terminateVisibilityTimeout?: boolean;
  sqs?: SQS;
  region?: string;
  handleMessageTimeout?: number;
  handleMessage?(message: SQS.Types.Message): Promise<void>;
  handleMessageBatch?(messages: SQS.Types.Message[]): Promise<void>;
}

export interface TimeoutResponse {
  timeoutHandle?: NodeJS.Timeout;
  promise: Promise<any>;
}

export type GithubActionsWorkflowJobStepStatus = 'queued' | 'in_progress' | 'completed';

export type GithubActionsWorkflowJobConclusion =
  | null
  | 'skipped'
  | 'success'
  | 'failure'
  | 'neutral'
  | 'cancelled'
  | 'timed_out'
  | 'action_required';

export interface GitHubWorkflowRunSummary extends GitHubWorkflowRunData {
  // Data result from: octokit.actions.listJobsForWorkflowRun(opts)
  jobsData: ActionsListJobsForWorkflowRunResponseData;
  // Data result from: octokit.actions.getWorkflowRun(opts)
  workflowData: ActionsGetWorkflowRunResponseData;
}

export interface ChatResponse extends WebAPICallResult {
  ok: boolean;
  error?: string;
  channel: string;
  ts: string;
  message: {
    text: string;
  };
  response_metadata?: {
    messages?: string[];
  };
}

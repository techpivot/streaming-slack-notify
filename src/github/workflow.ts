import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId } from '../utils';

export interface JobStepInterface {
  status: string;
  conclusion?: string; // 'success' | 'failure' | 'neutral' | 'cancelled' | 'timed_out' | 'action_required';
  name: string;
  number: number;
  // Currently we need to mock this for the last completed step. Currently ommitting the last two
  // started_at: string;
  // completed_at: string;
}

export interface JobInterface {
  check_run_url: string;
  completed_at: string;
  conclusion: string;
  head_sha: string;
  html_url: string;
  id: number;
  name: string;
  node_id: string;
  run_id: number;
  run_url: string;
  started_at: string;
  status: string; // 'queued' | 'in_progress' | 'completed';
  steps: JobStepInterface[];
  url: string;
}

export interface WorkflowSummaryInterface {
  jobs: Array<JobInterface>;
  workflow: object;
}

export const getWorkflowSummary = async (): Promise<WorkflowSummaryInterface> => {
  const token = getGithubToken();

  if (token === undefined) {
    throw new Error('Workflow summary requires GITHUB_TOKEN to access actions REST API');
  }

  const octokit = new GitHub(token);
  const { owner, repo } = context.repo;

  const opts = { run_id: getGithubRunId(), owner, repo };

  const [workflow, jobs] = await Promise.all([
    octokit.actions.getWorkflowRun(opts),
    octokit.actions.listJobsForWorkflowRun(opts),
  ]);

  return {
    workflow: workflow.data,
    jobs: jobs.data.jobs,
  };
};

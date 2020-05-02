import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId } from '../utils';

export interface JobStepInterface {
  status: string;
  name: string;
  number: number;
}

export interface JobInterface {
  completed_at: string;
  html_url: string;
  name: string;
  status: string;
  conclusion: string;
  started_at: string;
  steps: Array<JobStepInterface>;
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

  // eslint-disable-next-line
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

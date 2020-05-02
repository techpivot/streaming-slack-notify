import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId } from './utils';

interface WorkflowSummaryInterface {
  jobs: object;
  workflow: object;
}

export const getWorkflowSummary = async (): Promise<WorkflowSummaryInterface> => {
  const token = getGithubToken();

  if (token === undefined) {
    throw new Error('Workflow summary requires GITHUB_TOKEN to access actions REST API');
  }

  const octokit = new GitHub(token);
  const run_id = getGithubRunId();
  const { owner, repo } = context.repo;
  const opts = { run_id, owner, repo };

  const [workflow, jobs] = await Promise.all([
    octokit.actions.getWorkflowRun(opts),
    octokit.actions.listJobsForWorkflowRun(opts),
  ]);

  return {
    workflow: workflow.data,
    jobs: jobs.data.jobs,
  };
};

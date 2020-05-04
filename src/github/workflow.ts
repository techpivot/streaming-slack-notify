import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId, getJobContextName, getJobContextStatus, isFinalStep } from '../utils';
import {
  ActionsGetWorkflowRunResponse,
  ActionsListJobsForWorkflowRunResponseJobsItem,
  WorkflowSummaryInterface,
} from './types';

// eslint-disable-next-line
const isActionsGetWorkflowRunResponse = (payload: any): payload is ActionsGetWorkflowRunResponse => true;

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

  // Let's resolve some missing data for improved syncing
  const finalStep = isFinalStep();
  const contextJobStatus = getJobContextStatus();
  const contextJobName = getJobContextName();

  jobs.data.jobs.forEach((job: ActionsListJobsForWorkflowRunResponseJobsItem) => {
    const { name, status, steps } = job;

    // Little bit of sorcery here. Since there really is no way to tell if the workflow run has finished
    // from inside the GitHub action (since by definition it we're always in progress unless a another job failed),
    // we rely on input in the action and then also peek the status from the Job context. Using these, we can
    // tidy up the final display and the currently running job.

    if (finalStep && contextJobName === name && status !== 'completed') {
      switch (contextJobStatus) {
        case 'Success':
          const ts = new Date().toISOString();

          job.status = 'completed';
          job.conclusion = 'success';

          // The timing delta here is less than a second so it's fine to use current Date as all runners
          // have up-to-date time.
          job.completed_at = ts;

          // Mock the final step which isn't currently included so we don't have to adjust for this
          // discrepency below
          steps.push({
            name: 'Complete job',
            number: steps.length + 1,
            status: 'completed',
            conclusion: 'success',
            // @todo Timing?
          });

          // Update the workflow
          workflow.data.status = 'completed';
          workflow.data.updated_at = ts;
          break;

        case 'Cancelled':
          console.debug('in cancelled current, reference', workflow.data);
          break;

        case 'Failure':
          // Check to see the current job is manually cancelled
          switch (job.status) {
            case 'in_progress':
            case 'queued':
              // Fix, might need to add generic here depending on UI display below
              job.status = 'completed';
              job.conclusion = 'failure';
              // The timing delta here is less than a second so it's fine to use current Date as all runners
              // have up-to-date time.
              job.completed_at = new Date().toISOString();

              // We don't need to add a mock step because we won't use it for display purposes in the UI
              break;

            // leave all other cases
          }
          break;
      }
    }
  });

  // Quick type guard to coerce the 'conclusion'/'status' update fixes
  if (!isActionsGetWorkflowRunResponse(workflow.data)) {
    throw new Error();
  }

  return {
    workflow: workflow.data,
    jobs: jobs.data.jobs,
  };
};

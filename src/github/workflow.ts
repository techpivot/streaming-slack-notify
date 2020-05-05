import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId, getJobContextName, getJobContextStatus, isFinalStep } from '../utils';
import {
  ActionsGetWorkflowRunResponse,
  ActionsListJobsForWorkflowRunResponseJobsItem,
  WorkflowSummaryInterface,
} from './types';

export const getWorkflowSummary = async (): Promise<WorkflowSummaryInterface> => {
  const token = getGithubToken();

  if (token === undefined) {
    throw new Error('Workflow summary requires GITHUB_TOKEN to access actions REST API');
  }

  const octokit = new GitHub(token);
  const { owner, repo } = context.repo;
  const opts = { run_id: getGithubRunId(), owner, repo };

  const [workflow , jobs] = await Promise.all([
    octokit.actions.getWorkflowRun(opts),
    octokit.actions.listJobsForWorkflowRun(opts),
  ]);

  const jobsData = jobs.data.jobs;
  const workflowData = workflow.data as ActionsGetWorkflowRunResponse;


  // Let's resolve some missing data for improved syncing
  const finalStep = isFinalStep();
  const contextJobStatus = getJobContextStatus();
  const contextJobName = getJobContextName();

  jobsData.forEach((job: ActionsListJobsForWorkflowRunResponseJobsItem) => {
    const { name, status, steps } = job;

    // Little bit of sorcery here. Since there really is no way to tell if the workflow run has finished
    // from inside the GitHub action (since by definition it we're always in progress unless a another job failed),
    // we rely on input in the action and then also peek the status from the Job context. Using these, we can
    // tidy up the final display and the currently running job.

    if (finalStep && contextJobName === name && status !== 'completed') {
      switch (contextJobStatus) {
        case 'Success':
          const now = new Date();

          job.status = 'completed';
          job.conclusion = 'success';

          // The timing delta here is less than a second so it's fine to use current Date as all runners
          // have up-to-date time.
          job.completed_at = now.toISOString();

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
          workflowData.status = 'completed';
          workflowData.conclusion = 'success';

          // Note: There appears to be about a 2-5 second lag time after this step completes and the
          // final workflow update to the run. In order to keep this as close as possible, we will
          // add 3 seconds in our testing.
          workflowData.updated_at = (new Date(now.getMilliseconds() + 3200)).toISOString();
          break;

        case 'Cancelled':
          console.debug('in cancelled current, reference', workflow);
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

  return {
    workflow: workflowData,
    jobs: jobsData,
  };
};

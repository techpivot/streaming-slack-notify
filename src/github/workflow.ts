import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId, getJobContextName, getJobContextStatus, isFinalStep } from '../utils';
import {
  ActionsGetWorkflowRunResponse,
  ActionsListJobsForWorkflowRunResponseJobsItem,
  ActionsListJobsForWorkflowRunResponseJobsItemStepsItem,
  WorkflowSummaryInterface,
} from './types';

/**
 * Since the final "Complete job" won't ever be included via our action since it happens at the conclusion
 * after the entire run, we mock it for consistency.
 *
 * @param steps
 */
const addMockCompleteJob = (steps: ActionsListJobsForWorkflowRunResponseJobsItemStepsItem[]) => {
    steps.push({
      name: 'Complete job',
      number: steps.length + 1,
      status: 'completed',
      conclusion: 'success',
      // @todo Timing?
    });
}

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
      const now = new Date();

      switch (contextJobStatus) {
        case 'Success':
          addMockCompleteJob(steps);

          // Update Job
          job.status = 'completed';
          job.conclusion = 'success';
          // The timing delta here is less than a second so it's fine to use current Date as all runners
          // have up-to-date time.
          job.completed_at = now.toISOString();

          // Update workflow
          workflowData.status = 'completed';
          workflowData.conclusion = 'success';

          // Note: There appears to be about a 2-5 second lag time after this step completes and the
          // final workflow update to the run. In order to keep this as close as possible, we will
          // add 3.6 seconds in our testing.
          workflowData.updated_at = (new Date(now.getTime() + 3600)).toISOString();
          break;

        case 'Cancelled':
          addMockCompleteJob(steps);

          console.log('>> cancelled');
          console.log(steps);

          // Update Job
          job.status = 'completed';
          job.conclusion = 'cancelled';
          job.completed_at = now.toISOString();

          // Update the workflow
          workflowData.status = 'completed';
          workflowData.conclusion = 'cancelled';

          // Note: There appears to be about a 2-5 second lag time after this step completes and the
          // final workflow update to the run. In order to keep this as close as possible, we will
          // add 3.6 seconds in our testing.
          workflowData.updated_at = (new Date(now.getTime() + 3600)).toISOString();

          break;

        case 'Failure':
          // Check to see the current job is manually cancelled
          switch (job.status) {
            // Only adjust jobs that are still in progress. Meaning, in the slight chance that the current job
            // actually is already complete or not yet run, then we don't touch that.
            case 'in_progress':
              addMockCompleteJob(steps);

              // Update Job
              job.status = 'completed';
              job.conclusion = 'failure';
              // The timing delta here is less than a second so it's fine to use current Date as all runners
              // have up-to-date time.
              job.completed_at = now.toISOString();

              // Update the workflow
              workflowData.status = 'completed';
              workflowData.conclusion = 'failure';

              // Note: There appears to be about a 2-5 second lag time after this step completes and the
              // final workflow update to the run. In order to keep this as close as possible, we will
              // add 3.6 seconds in our testing.
              workflowData.updated_at = (new Date(now.getTime() + 3600)).toISOString();
              break;

            default:
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

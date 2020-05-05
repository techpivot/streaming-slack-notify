import { context, GitHub } from '@actions/github';
import { getGithubToken, getGithubRunId, getJobContextName, getJobContextStatus, isFinalStep } from '../utils';
import {
  ActionsConclusion,
  ActionsStatus,
  ActionsGetWorkflowRunResponse,
  ActionsListJobsForWorkflowRunResponseJobsItem,
  WorkflowSummaryInterface,
} from './types';

/**
 * There appears to be about a 0.3 second lag time for the completed job buffer.
 *
 * @param workflowData
 */
const modifyJobStatus = (
  job: ActionsListJobsForWorkflowRunResponseJobsItem,
  status: ActionsStatus,
  conclusion: ActionsConclusion
): void => {
  const now:Date = new Date();

  job.completed_at = new Date(now.getTime() + 300).toISOString();
  job.status = status;
  job.conclusion = conclusion;
  job.steps.push({
    name: 'Complete job',
    number: job.steps.length + 1,
    status: 'completed',
    conclusion: 'success',
    // @todo Timing?
  });
};

/**
 * There appears to be about a 2-5 second lag time after this step completes and the
 * final workflow update to the run. In order to keep this as close as possible, we will
 * add extra time, roughly 4 seconds in our testing.
 *
 * @param workflowData
 */
const modifyWorkflowStatus = (
  workflowData: ActionsGetWorkflowRunResponse,
  status: ActionsStatus,
  conclusion: ActionsConclusion
): void => {
  const now: Date = new Date();

  workflowData.updated_at = new Date(now.getTime() + 3900).toISOString();
  workflowData.status = status;
  workflowData.conclusion = conclusion;
};

export const getWorkflowSummary = async (): Promise<WorkflowSummaryInterface> => {
  const token: string = getGithubToken();

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

  const jobsData = jobs.data.jobs as ActionsListJobsForWorkflowRunResponseJobsItem[];
  const workflowData = workflow.data as ActionsGetWorkflowRunResponse;

  // Let's resolve some missing data for improved syncing
  const finalStep: boolean = isFinalStep();
  const contextJobStatus: string = getJobContextStatus();
  const contextJobName: string = getJobContextName();
  let jobIdLogsToFetch: number | undefined;

  jobsData.forEach((job: ActionsListJobsForWorkflowRunResponseJobsItem) => {
    const { id, name, status } = job;

    // Little bit of sorcery here. Since there really is no way to tell if the workflow run has finished
    // from inside the GitHub action (since by definition it we're always in progress unless a another job failed),
    // we rely on input in the action and then also peek the status from the Job context. Using these, we can
    // tidy up the final display and the currently running job.

    if (finalStep && contextJobName === name && status !== 'completed') {
      switch (contextJobStatus) {
        case 'Success':
          modifyWorkflowStatus(workflowData, 'completed', 'success');
          modifyJobStatus(job, 'completed', 'success');
          break;

        case 'Cancelled':
          modifyWorkflowStatus(workflowData, 'completed', 'cancelled');
          modifyJobStatus(job, 'completed', 'cancelled');
          break;

        case 'Failure':
          // Check to see the current job is manually cancelled
          switch (job.status) {
            // Only adjust jobs that are still in progress. Meaning, in the slight chance that the current job
            // actually is already complete or not yet run, then we don't touch that.
            case 'in_progress':
              modifyWorkflowStatus(workflowData, 'completed', 'failure');
              modifyJobStatus(job, 'completed', 'failure');
              jobIdLogsToFetch = id;
              break;

            default:
            // leave all other cases
          }
          break;
      }
    }
  });


  if (jobIdLogsToFetch) {
    console.log('A');
                // Let's also download the failures
                try {
                  console.log('opts', { owner, repo, job_id: jobIdLogsToFetch });
    const r = await octokit.actions.listWorkflowJobLogs({ owner, repo, job_id: jobIdLogsToFetch })
    console.log('got response>>>');
    console.log(r);
                } catch (error) {
                  console.error('here');
                  console.error(error);
                }

  }


  console.log('returning');
  return {
    workflow: workflowData,
    jobs: jobsData,
  };
};

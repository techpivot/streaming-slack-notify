import { ImageElement, PlainTextElement, MrkdwnElement, MessageAttachment } from '@slack/types';
import { components } from '@octokit/openapi-types';
import { ListJobsForWorkflowRunResponseData } from '../github-poller/types';
import { getReadableDurationString } from '../../../common/lib/utils';

/**
 * Determine the current step index for a job. For now, we can iterate positively as it appears all the steps
 * are ordered sequentially. There is a 'number' field; which appears to be increasing and some hidden steps
 * as they aren't linear.
 *
 * Note: Zero-indexed
 */
const getCurrentStepIndexForJob = (job: components['schemas']['job']): number => {
  const { name, steps } = job;

  if (!steps) {
    throw new Error(`Unable to determine current step for job: ${name}`);
  }

  // Sort steps by number as this allows for easier logic.
  steps.sort((stepA, stepB) => (stepA.number > stepB.number ? 1 : -1));

  let currentStepIndex = 0;

  stepLoop: for (let i = 0; i < steps.length; i += 1) {
    const step = steps[i];

    switch (step.status) {
      case 'completed':
        switch (step.conclusion) {
          case 'skipped':
          case 'success':
          case 'neutral':
            break;

          // The first failed action is the step index. Return immediately
          case 'failure':
          case 'cancelled':
          case 'timed_out':
          case 'action_required':
            currentStepIndex = i;
            break stepLoop;
        }
        break;

      case 'queued':
        break;

      case 'in_progress':
        currentStepIndex = i;
        break;

      default:
        throw new Error(`Unable to determine current step for job ${name} with unknown status ${steps[i].status}`);
    }
  }

  return currentStepIndex;
};

const getJobAttachments = (jobsData: ListJobsForWorkflowRunResponseData): MessageAttachment[] => {
  const attachments: MessageAttachment[] = [];

  // For consistency, let's sort the jobs by `started_at` as the entries are often mis-aligned and if we want
  // to ensure these line up how they're ordered in the workflow files and how their also displayed on
  // the  GitHub workflow run UI.
  // jobsData.jobs.sort((a, b) => {
  //   return (new Date(b.started_at)).getTime() - (new Date(a.started_at)).getTime();
  // });

  jobsData.jobs.forEach((job) => {
    const { completed_at, html_url, name, status, conclusion, started_at, steps } = job;
    const currentStepIndex = getCurrentStepIndexForJob(job);
    const currentStepIndexName: string | undefined = steps[currentStepIndex]?.name;
    const elements: (ImageElement | PlainTextElement | MrkdwnElement)[] = [];
    let icon = '';
    let color;

    switch (status) {
      case 'in_progress':
        color = '#d2942c';
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });

        // Note: For in progress, the current steps don't include the last step "Complete job".
        // Thus let's increase by one to account for this. Additionally, the ${currentStepIndex}
        // is zero-indexed so convert this to human numbered indexed (+1)

        elements.push({
          type: 'mrkdwn',
          text: `*${currentStepIndexName}* (${currentStepIndex + 1} of ${steps.length + 1})`,
        });

        break;

      case 'queued':
        icon = ':white_circle:';
        color = '#d2d2d2';
        elements.push({
          type: 'mrkdwn',
          text: '_Queued_',
        });
        break;

      case 'completed':
        switch (conclusion) {
          case 'success':
            color = '#28a745';
            icon = ':heavy_check_mark:';
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully*`,
            });
            break;

          case 'neutral':
            color = '#28a745';
            icon = ':white_check_mark:';
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully* _(Neutral)_`,
            });
            break;

          // In the event of a failure or cancellation we need to be congnizent if we don't have a current
          // step from the job.

          case 'cancelled':
            color = '#ea3131';
            icon = ':no_entry_sign:';
            elements.push({
              type: 'mrkdwn',
              text:
                currentStepIndexName === undefined
                  ? `*Cancelled*`
                  : `*Cancelled* on step *${currentStepIndexName}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            break;

          case 'failure':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text:
                currentStepIndexName === undefined
                  ? `*Failed*`
                  : `*Failed* on step *${currentStepIndexName}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            break;

          case 'timed_out':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text:
                currentStepIndexName === undefined
                  ? `*Timed out*`
                  : `*Timed out* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${
                      steps.length
                    })`,
            });
            break;

          case 'skipped':
            color = '#d2d2d2';
            icon = ':black_small_square:';
            elements.push({
              type: 'mrkdwn',
              text: `_Skipped_`,
            });
            break;

          case 'action_required':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Failed* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            elements.push({
              type: 'mrkdwn',
              text: `_Manual Action Required_`,
            });
            break;
        }
        break;

      default:
        throw new Error(`Unknown job status: ${status}`);
    }

    elements.unshift({
      type: 'mrkdwn',
      text: `*Job*: *<${html_url}|${name}>*`,
    });
    elements.unshift({
      type: 'mrkdwn',
      text: icon,
    });

    // Get the duration
    if (started_at && conclusion !== 'skipped') {
      elements.push({
        type: 'mrkdwn',
        // Note: Match the styling as close as possible to actual GitHub actions layout
        text: `:clock3:${getReadableDurationString(
          new Date(started_at),
          completed_at ? new Date(completed_at) : new Date()
        )}`,
      });
    }

    attachments.push({
      color,
      blocks: [{ type: 'context', elements }],
    });
  });

  return attachments;
};

export default getJobAttachments;

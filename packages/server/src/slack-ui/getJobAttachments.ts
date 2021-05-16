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

const getJobAttachments = (jobsData: ListJobsForWorkflowRunResponseData): Array<MessageAttachment> => {
  const attachments: Array<MessageAttachment> = [];

  jobsData.jobs.forEach((job) => {
    const { completed_at, html_url, name, status, conclusion, started_at, steps } = job;
    const currentStepIndex = getCurrentStepIndexForJob(job);
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
          text: `*${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length + 1})`,
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

          case 'cancelled':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Cancelled* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${
                steps.length
              })`,
            });
            break;

          case 'failure':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Failed* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${steps.length})`,
            });
            break;

          case 'timed_out':
            color = '#ea3131';
            icon = ':x:';
            elements.push({
              type: 'mrkdwn',
              text: `*Timed out* on step *${steps[currentStepIndex].name}* (${currentStepIndex + 1} of ${
                steps.length
              })`,
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
    if (started_at) {
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

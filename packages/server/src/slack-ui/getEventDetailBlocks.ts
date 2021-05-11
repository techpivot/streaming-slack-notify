import { ImageElement, PlainTextElement, MrkdwnElement, MessageAttachment } from '@slack/types';
import { ListJobsForWorkflowRunResponseData } from '../github-poller/types';
import { getReadableDurationString } from '../../../common/lib/utils';

const getJobAttachments = (jobsData: ListJobsForWorkflowRunResponseData): Array<MessageAttachment> => {
  const attachments: Array<MessageAttachment> = [];

  jobsData.jobs.forEach((job: any) => {
    const elements: (ImageElement | PlainTextElement | MrkdwnElement)[] = [];
    const { completed_at, html_url, name, status, conclusion, started_at, steps } = job;
    let icon = '';
    let color;
    let currentStep;
    let currentStepIndex = 0; // Zero indexed

    stepLoop: for (let i = 0; i < steps.length; i += 1) {
      switch (steps[i].status) {
        case 'completed':
          switch (steps[i].conclusion) {
            case 'skipped':
              break stepLoop;

            case 'failure':
            case 'success':
            case 'neutral':
            case 'cancelled':
            case 'timed_out':
            case 'action_required':
              if (!currentStep || steps[i].number > currentStep.number) {
                currentStepIndex = i;
                currentStep = steps[i];
              }
              break;
          }
          break;

        case 'queued':
          break;

        case 'in_progress':
          if (!currentStep || steps[i].number > currentStep.number) {
            currentStepIndex = i;
            currentStep = steps[i];
          }
          break;

        // Assume we have 10 steps and we have a failure/cancel after step 4. That means steps 1-4 are filled out
        // 5-9 are all "queued", but we've already populated the mock "Complete job" step as success. We don't
        // want to move the active step to this position. Instead, break immediately.
        default:
          break stepLoop;
      }
    }

    if (!currentStep) {
      // This will never happen just type safety
      throw new Error('Unable to determine current job step');
    }

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

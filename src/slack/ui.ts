import * as github from '@actions/github';
import * as Webhooks from '@octokit/webhooks';
import {
  ImageElement,
  PlainTextElement,
  MrkdwnElement,
  DividerBlock,
  KnownBlock,
  MessageAttachment,
} from '@slack/types';
import { ActionsListJobsForWorkflowRunResponseJobsItemStepsItem, WorkflowSummaryInterface } from '../github/types';
import { getLastJobOutputIndex, saveLastJobOutputIndex } from '../github/artifacts';
import { COLOR_SUCCESS, COLOR_ERROR, COLOR_IN_PROGRESS, COLOR_QUEUED } from '../const';
import {
  getActionBranch,
  getActionEventName,
  getGithubRunId,
  getGithubRepositoryUrl,
  getGithubRepositoryFullName,
  getReadableDurationString,
  getWorkflowName,
} from '../utils';

export const getDividerBlock = (): DividerBlock => {
  return {
    type: 'divider',
  };
};

/**
 * For consistency, ensure changes to this function are appropriately reflected in `getTitleBlocks()`
 * @param workflowSummary
 */
export const getFallbackText = (workflowSummary: WorkflowSummaryInterface): string => {
  return `GitHub actions is running workflow: ${getWorkflowName()}`;
};

/**
 * For consistency, ensure changes to this function are appropriately reflected in `getFallbackText()`
 * @param workflowSummary
 */
export const getTitleBlocks = (workflowSummary: WorkflowSummaryInterface): KnownBlock[] => {
  // Theoretically, we should always be in 'in_progress' stage; however, we mock the completed to handle
  // consistent UI output in various parts of the output blocks. (See ../github/workflow)
  const { status, conclusion, created_at, updated_at } = workflowSummary.workflow;
  let action;
  let icon = '';
  let clock = '';
  let finishTime;

  switch (status) {
    case 'queued':
      action = 'is queued';
      break;

    case 'in_progress':
      action = 'is running';
      finishTime = (new Date()).toISOString();
      break;

    case 'completed': {
      action = 'completed';
      finishTime = updated_at;

      switch (conclusion) {
        case 'success':
          icon = ':heavy_check_mark: ';
          break;

        case 'neutral':
          icon = ':white_check_mark: ';
          break;

        case 'failure':
          icon = ':x: ';
          break;

        case 'cancelled':
          icon = ':x: ';
          break;

        case 'timed_out':
          icon = ':x: ';
          break;

        case 'action_required':
          icon = ':exclamation: ';
          break;
      }
      break;
    }
  }

  // Get the duration
  if (finishTime) {
    clock = `    :clock3:${getReadableDurationString(new Date(created_at), new Date(finishTime))}`;
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${icon}Workflow *<${getGithubRepositoryUrl()}/actions/runs/${getGithubRunId()}|${getWorkflowName()}>* ${action}.${clock}`,
      },
    },
  ];
};

export const getEventSummaryBlocks = (): KnownBlock[] => {
  const eventName = getActionEventName();
  const elements: MrkdwnElement[] = [];

  elements.push({
    type: 'mrkdwn',
    text: `*<${getGithubRepositoryUrl()}|${getGithubRepositoryFullName()}>*`,
  });
  elements.push({
    type: 'mrkdwn',
    text: '*Event*: `' + eventName + '`',
  });

  switch (eventName) {
    case 'push':
      elements.push({
        type: 'mrkdwn',
        text: '*Branch*: `' + getActionBranch() + '`',
      });
      break;
  }

  return [
    {
      type: 'context',
      elements,
    },
  ];
};

export const getCommitBlocks = (): KnownBlock[] => {
  const blocks: KnownBlock[] = [];

  switch (getActionEventName()) {
    case 'push': {
      const payload = github.context.payload as Webhooks.WebhookPayloadPush;

      const maxCommits = 2;
      let index = 0;

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      payload.commits.slice(0, maxCommits).forEach((commit: any) => {
        index += 1;

        const {
          id,
          url,
          message,
          author: { username },
        } = commit;

        if (index > 1) {
          blocks.push(getDividerBlock());
        }

        blocks.push(
          {
            type: 'section',
            text: {
              type: 'mrkdwn',
              text: `*<${url}|${id.substring(0, 7)}>*: ${message}`,
            },
          },
          {
            type: 'context',
            elements: [
              {
                type: 'image',
                image_url: `https://github.com/${username}.png`,
                alt_text: username,
              },
              {
                type: 'mrkdwn',
                text: `*<https://github.com/${username}|${username}>*`,
              },
            ],
          }
        );
      });

      if (payload.commits.length > maxCommits) {
        const extra = payload.commits.length - maxCommits;
        blocks.push({
          type: 'context',
          elements: [
            {
              type: 'mrkdwn',
              text: `Plus *${extra}* more ${extra === 1 ? 'commit' : 'commits'}`,
            },
          ],
        });
      }

      break;
    }
  }

  return blocks;
};

export const getJobAttachments = (workflowSummary: WorkflowSummaryInterface): Array<MessageAttachment> => {
  const attachments: Array<MessageAttachment> = [];

  workflowSummary.jobs.forEach((job) => {
    const elements: (ImageElement | PlainTextElement | MrkdwnElement)[] = [];
    const { completed_at, html_url, name, status, conclusion, started_at, steps } = job;
    const lastJobOutputIndex = getLastJobOutputIndex(name) || 0;
    let icon = '';
    let color;
    let currentStep: ActionsListJobsForWorkflowRunResponseJobsItemStepsItem | undefined;
    let currentStepIndex = 0; // Zero indexed

    for (let i = 0; i < steps.length; i += 1) {
      switch (steps[i].status) {
        case 'completed':
        case 'in_progress':
          if (!currentStep || steps[i].number > currentStep.number) {
            currentStepIndex = i;
            currentStep = steps[i];
          }
          break;
      }
    }

    if (!currentStep) {
      // This will never happen just type safety
      throw new Error('Unable to determine current job step');
    }

    // Reference
    // =========
    // status: queued, in_progress, completed

    switch (status) {
      case 'in_progress':
        color = COLOR_IN_PROGRESS;
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });

        // Update the step name to never display our slack notification name. In order to minimize
        // the action YAML our readme/docs don't require naming/IDs. This reduction also allows
        // the default naming to be consistent. In this case, if we're an in progress and the actions
        // is actually on it self (or from 1 + n behind) ... let's bump to the next one which is
        // even more accurate.

        if (currentStep.name.indexOf('techpivot/streaming-slack-notify') >= 0 && steps[currentStepIndex + 1]) {
          // We could potentially walk this continously; however, that's silly and if the end-user wants
          // to notify multiple slack notifies ... well then we'll just have to display that as that's
          // what we're actually doing.

          // Now, in terms of updating the step: Our current observations are as follows. In a multi-step job,
          // the first techpivot/streaming-slack-notify will occur spot on; however, subsequent notifications,
          // typically are slightly late meaning we should display the subsequent notification. However, sometimes
          // we are spot on and thus we do our best to spread out the progress notifications accordingly. We save
          // the currentStepIndex and will find the NEXT available.
          for (let i = Math.max(lastJobOutputIndex, currentStepIndex - 1); i <= currentStepIndex + 1; i += 1) {
            if (steps[i].name.indexOf('techpivot/streaming-slack-notify') < 0) {
              console.debug(`Updating step display from "${steps[currentStepIndex].name}" to "${steps[i].name}"`);
              currentStepIndex = i;
              break;
            }
          }
        }

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
        color = COLOR_QUEUED;
        elements.push({
          type: 'mrkdwn',
          text: '_Queued_',
        });
        console.log('check queue jobs');
        break;

      case 'completed':
        // Reference
        // =========
        // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required

        switch (conclusion) {
          case 'success':
            icon = ':heavy_check_mark:';
            color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully*`,
            });
            break;

          case 'neutral':
            icon = ':heavy_check_mark:';
            color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${steps.length}* steps completed *successfully* _(Neutral)_`,
            });
            break;

          case 'failure':
          case 'cancelled':
          case 'timed_out':
          case 'action_required':
            icon = ':x:';
            color = COLOR_ERROR;
            elements.push({
              type: 'mrkdwn',
              text: `errorn `,
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

    // Save the current step
    saveLastJobOutputIndex(name, currentStepIndex);

    attachments.push({
      color,
      blocks: [{ type: 'context', elements }],
    });
  });

  return attachments;
};

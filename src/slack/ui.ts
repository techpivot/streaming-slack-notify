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
import { WorkflowSummaryInterface } from '../github/workflow';
import { COLOR_SUCCESS, COLOR_ERROR, COLOR_IN_PROGRESS, COLOR_QUEUED } from '../const';
import {
  getActionBranch,
  getActionEventName,
  getGithubRunId,
  getGithubRepositoryUrl,
  getGithubRepositoryName,
  getReadableDurationString,
  getWorkflowName,
} from '../utils';

export const getTitleBlocks = (): KnownBlock[] => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `GitHub actions is running *workflow*: *<${getGithubRepositoryUrl()}/actions/runs/${getGithubRunId()}|${getWorkflowName()}>*`,
      },
    },
  ];
};

export const getEventSummaryBlocks = (): KnownBlock[] => {
  const eventName = getActionEventName();
  const fields = [`*<${getGithubRepositoryUrl}|${getGithubRepositoryName()}>*`, '*Event*: `' + eventName + '`'];

  if (eventName === 'push') {
    fields.push('*Branch*: `' + getActionBranch() + '`');
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: fields.join('     '),
      },
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

      payload.commits
        .reverse()
        .slice(0, maxCommits)
        .forEach((commit: any) => {
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
    const { completed_at, html_url, name, status, started_at, steps } = job;
    let icon = '';
    let color;
    let currentStep;
    let totalActiveSteps = 0;

    for (let i = 0; i < steps.length; i += 1) {
      switch (steps[i].status) {
        case 'completed':
        case 'in_progress':
          totalActiveSteps += 1;
          if (!currentStep || steps[i].number > currentStep.number) {
            currentStep = steps[i];
          }
          break;
      }
    }

    if (!currentStep) {
      // This will never happen just type safety
      throw new Error('Unable to determine current job step');
    }

    console.log('current active step: ', currentStep);

    // Reference
    // =========
    // status: queued, in_progress, completed

    switch (job.status) {
      case 'in_progress':
        color = COLOR_IN_PROGRESS;
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });
        elements.push({
          type: 'mrkdwn',
          text: `*${currentStep.name}* (${totalActiveSteps} of ${steps.length})`,
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

        switch (job.conclusion) {
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

    attachments.push({
      color,
      blocks: [{ type: 'context', elements }],
    });
  });

  return attachments;
};

export const getDividerBlock = (): DividerBlock => {
  return {
    type: 'divider',
  };
};

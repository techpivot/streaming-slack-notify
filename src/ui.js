import * as github from '@actions/github';
import {
  COLOR_SUCCESS,
  COLOR_ERROR,
  COLOR_IN_PROGRESS,
  COLOR_QUEUED,
} from './const';
import { getReadableDurationString } from './utils';

export const getTitleBlocks = (workflowSummary) => {
  const { GITHUB_RUN_ID } = process.env;
  const {
    context: {
      workflow,
      payload: {
        repository: { url },
      },
    },
  } = github;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `GitHub actions is running *workflow*: *<${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>*`,
      },
    },
  ];
};

export const getEventSummaryBlocks = () => {
  const {
    context: {
      eventName,
      ref,
      workflow,
      payload: {
        repository: { url },
      },
    },
  } = github;
  const { GITHUB_RUN_ID, GITHUB_REPOSITORY } = process.env;

  const fields = [
    `*<${url}|${GITHUB_REPOSITORY}>*`,
    '*Event*: `' + eventName + '`',
  ];

  if (eventName === 'push') {
    fields.push('*Branch*: `' + ref.trim('/').replace('refs/heads/', '') + '`');
  }

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `Running workflow: *<${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>*\n` +
          fields.join('     '),
      },
    },
  ];
};

export const getCommitBlocks = () => {
  const {
    context: { eventName, payload },
  } = github;

  const blocks = [];

  if (eventName === 'push') {
    const maxCommits = 2;
    let index = 0;

    payload.commits
      .reverse()
      .slice(0, maxCommits)
      .forEach((commit) => {
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
  }

  return blocks;
};

export const getJobAttachments = (workflowSummary) => {
  const attachments = [];

  console.log(JSON.stringify(workflowSummary));

  workflowSummary.jobs.forEach((job) => {
    const elements = [];
    let icon;
    let color;
    let currentStep;
    let totalActiveSteps = 0;

    for (let i = 0; i < job.steps.length; i += 1) {
      switch (job.steps[i].status) {
        case 'completed':
        case 'in_progress':
          totalActiveSteps += 1;
          if (currentStep && jobs.steps[i].number > currentStep.number) {
            currentStep = job.steps[i];
          }
      }
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
          text: `*${currentStep.name}* (${totalActiveSteps} of ${job.steps.length})`,
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
              text: `*${job.steps.length}* steps completed *successfully*`,
            });
            break;

          case 'neutral':
            icon = ':heavy_check_mark:';
            color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${job.steps.length}* steps completed *successfully* _(Neutral)_`,
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
        throw new Error(`Unknown job status: ${job.status}`);
    }

    elements.unshift({
      type: 'mrkdwn',
      text: `*Job*: *<${job.html_url}|${job.name}>*`,
    });
    elements.unshift({
      type: 'mrkdwn',
      text: icon,
    });

    // Get the duration
    if (job.started_at) {
      elements.push({
        type: 'mrkdwn',
        // Note: Match the styling as close as possible to actual GitHub actions layout
        text: `:clock3:${getReadableDurationString(
          new Date(job.started_at),
          job.completed_at ? new Date(job.completed_at) : new Date()
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

export const getDividerBlock = () => {
  return {
    type: 'divider',
  };
};

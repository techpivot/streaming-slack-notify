import * as github from '@actions/github';
import {
  COLOR_SUCCESS,
  COLOR_ERROR,
  COLOR_IN_PROGRESS,
  COLOR_QUEUED,
} from './const';
import { getReadableDurationString } from './utils';

export const getMessageText = () => {
  const { url } = github.context.payload.repository;
  const { GITHUB_REPOSITORY } = process.env;

  return `*<${url}|${GITHUB_REPOSITORY}>*`;
};

export const getJobSummaryBlocks = (workflowSummary) => {
  const rows = [];

  workflowSummary.jobs.forEach((job) => {
    // Reference
    // =========
    // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required
    // status: queued, in_progress, completed

    let actionStep;
    let totalCompleted = 0;

    outerLoop: for (let i = 0; i < job.steps.length; i += 1) {
      actionStep = job.steps[i];
      switch (actionStep.status) {
        case 'completed':
          totalCompleted += 1;
          break outerLoop;

        case 'in_progress':
          break outerLoop;

        case 'queued':
        default:
          break;
      }
    }

    switch (job.status) {
      case 'in_progress':
        rows.push(
          `:hourglass_flowing_sand:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(In progress [${totalCompleted} of ${job.steps.length} complete])_`
        );
        break;

      case 'queued':
        rows.push(
          `:timer_clock:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Queued)_`
        );
        break;

      case 'completed':
        switch (job.conclusion) {
          case 'success':
            rows.push(
              `:heavy_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed successfully`
            );
            break;

          case 'failure':
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Completed)_`
            );
            break;

          case 'neutral':
            rows.push(
              `:white_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed _(neutral)_`
            );
            break;

          case 'cancelled':
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  _(Cancelled [${totalCompleted} of ${job.steps.length} completed])_`
            );
            break;

          case 'timed_out':
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Timed out [${totalCompleted} of ${job.steps.length} completed])_`
            );
            break;

          case 'action_required':
            rows.push(
              `:exclamation:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Manual Action Required)_`
            );
            break;
        }
        break;

      default:
        throw new Error(`Unknown job status: ${job.status}`);
    }
  });

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: rows.join('\n'),
      },
    },
  ];
};

export const getJobAttachments = (workflowSummary) => {
  const attachments = [];

  workflowSummary.jobs.forEach((job) => {
    const attachment = {};
    const rows = [];

    // Reference
    // =========
    // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required
    // status: queued, in_progress, completed

    let actionStep;
    let totalCompleted = 0;

    outerLoop: for (let i = 0; i < job.steps.length; i += 1) {
      actionStep = job.steps[i];
      switch (actionStep.status) {
        case 'completed':
          totalCompleted += 1;
          break outerLoop;

        case 'in_progress':
          break outerLoop;

        case 'queued':
        default:
          break;
      }
    }

    switch (job.status) {
      case 'in_progress':
        attachment.color = COLOR_IN_PROGRESS;
        rows.push(
          `:hourglass_flowing_sand:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(In progress [${totalCompleted} of ${job.steps.length} complete])_`
        );
        break;

      case 'queued':
        attachment.color = COLOR_QUEUED;
        rows.push(
          `:timer_clock:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Queued)_`
        );
        break;

      case 'completed':
        switch (job.conclusion) {
          case 'success':
            attachment.color = COLOR_SUCCESS;
            rows.push(
              `:heavy_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed successfully`
            );
            break;

          case 'failure':
            attachment.color = COLOR_ERROR;
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Completed)_`
            );
            break;

          case 'neutral':
            attachment.color = COLOR_SUCCESS;
            rows.push(
              `:white_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed _(neutral)_`
            );
            break;

          case 'cancelled':
            attachment.color = COLOR_ERROR;
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  _(Cancelled [${totalCompleted} of ${job.steps.length} completed])_`
            );
            break;

          case 'timed_out':
            attachment.color = COLOR_ERROR;
            rows.push(
              `:x:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Timed out [${totalCompleted} of ${job.steps.length} completed])_`
            );
            break;

          case 'action_required':
            attachment.color = COLOR_ERROR;
            rows.push(
              `:exclamation:  *<${job.url}|${job.name}>*:  ${actionStep.name}  _(Manual Action Required)_`
            );
            break;
        }
        break;

      default:
        throw new Error(`Unknown job status: ${job.status}`);
    }

    attachment.blocks = [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: rows.join('\n'),
        },
      },
    ];

    attachments.push(attachment);
  });

  console.log('>>> HERE', attachments);

  return attachments;
};

export const getJobAttachments2 = (workflowSummary) => {
  const attachments = [];

  workflowSummary.jobs.forEach((job) => {
    const attachment = {};
    const elements = [];

    // Reference
    // =========
    // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required
    // status: queued, in_progress, completed

    let actionStep;
    let totalCompleted = 0;

    outerLoop: for (let i = 0; i < job.steps.length; i += 1) {
      actionStep = job.steps[i];
      switch (actionStep.status) {
        case 'completed':
          totalCompleted += 1;
          break outerLoop;

        case 'in_progress':
          break outerLoop;

        case 'queued':
        default:
          break;
      }
    }

    let icon;

    switch (job.status) {
      case 'in_progress':
        attachment.color = COLOR_IN_PROGRESS;
        icon = ':hourglass_flowing_sand:';
        elements.push({
          type: 'mrkdwn',
          text: '_In Progress_',
        });
        elements.push({
          type: 'mrkdwn',
          text: `*${actionStep.name}* (${totalCompleted} of ${job.steps.length})`,
        });
        break;

      case 'queued':
        icon = ':white_circle:';
        attachment.color = COLOR_QUEUED;
        elements.push({
          type: 'mrkdwn',
          text: '_Queued_',
        });
        console.log('check queue jobs');
        break;

      case 'completed':
        switch (job.conclusion) {
          case 'success':
            icon = ':heavy_check_mark:';
            attachment.color = COLOR_SUCCESS;

            elements.push({
              type: 'mrkdwn',
              text: `*${job.steps.length}* steps completed *successfully* `,
            });
            /*rows.push(
              `:heavy_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed successfully`
            );*/
            break;

          case 'neutral':
            icon = ':heavy_check_mark:';
            attachment.color = COLOR_SUCCESS;
            elements.push({
              type: 'mrkdwn',
              text: `*${job.steps.length}* steps completed *successfully* _(Neutral)_`,
            });
            /*
            rows.push(
              `:white_check_mark:  *<${job.url}|${job.name}>*:  ${totalCompleted} of ${job.steps.length} completed _(neutral)_`
            ); */
            break;

          case 'failure':
          case 'cancelled':
          case 'timed_out':
          case 'action_required':
            icon = ':x:';
            attachment.color = COLOR_ERROR;
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
      text: `*Job*: *<${job.url}|${job.name}>*`,
    });
    elements.unshift({
      type: 'mrkdwn',
      text: icon,
    });

    // Get the duration
    if (job.started_at) {
      elements.push({
        type: 'mrkdwn',
        text: `:clock3:${getReadableDurationString(
          new Date(job.started_at),
          job.completed_at ? new Date(job.completed_at) : new Date()
        )}`,
      });
    }

    attachment.blocks = [
      {
        type: 'context',
        elements,
      },
    ];

    attachments.push(attachment);
  });

  console.log('>>> HERE', attachments);

  return attachments;
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
    //`*Workflow*: <${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>`,
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
        text: `Running workflow: *<${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>*\n` + fields.join('     '),
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

export const getDividerBlock = () => {
  return {
    type: 'divider',
  };
};

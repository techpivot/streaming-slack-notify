import * as github from '@actions/github';

export const getMessageText = () => {
  const { url } = github.context.payload.repository;
  const { GITHUB_REPOSITORY } = process.env;

  return `*<${url}|${GITHUB_REPOSITORY}>*`;
};

export const getJobSummaryBlocks = (workflowSummary) => {
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

  const rows = [];

  workflowSummary.jobs.forEach((job) => {
    let lastStep = job.steps[job.steps.length - 1];
    let rowText = '';
    let icon;
    let stausVerb;
    console.log(` >>>> ${job.name} : ${job.status}`);

    // conclusion: null, success, failure, neutral, cancelled, timed_out or action_required
    // status: queued, in_progress, completed

    switch (job.status) {
      case 'in_progress':
        statusVerb = 'In progress';
        icon = ':hourglass_flowing_sand';
        break;

      case 'completed':
        switch (job.conclusion) {
          case 'success':
            statusVerb = 'Completed';
            icon = ':heavy_check_mark:';
            break;

          case 'failure':
            statusVerb = 'Completed';
            icon = ':x:';
            break;

          case 'neutral':
            statusVerb = 'Completed (Neutral)';
            icon = ':white_check_mark:';
            break;

          case 'cancelled':
            statusVerb = 'Cancelled';
            icon = ':x:';
            break;

          case 'timed_out':
            statusVerb = 'Timed out';
            icon = ':x:';
            break;

          case 'action_required':
            statusVerb = 'Manual Action Required';
            icon = ':exclamation:';
            break;
        }
        break;

      case 'queued':
        break;

      default:
        throw new Error(`Unknown job status: ${job.status}`);
    }
    rowText += `${icon}  *${job.name}*:  ${lastStep.name}  _(${statusVerb})_`;
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
  const { GITHUB_RUN_ID } = process.env;

  const fields = [
    `*Workflow*: <${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>`,
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
        text: fields.join('     '),
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

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

  const blocks = [];

  return [];
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

import * as github from '@actions/github';

export const getMessageText = () => {
  const { url } = github.context.repository;
  const { GITHUB_REPOSITORY } = process.env;

  return `<${url}|${GITHUB_REPOSITORY}>`
}

export const getHeaderBlocks = () => {
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
    const max = 2;
    let index = 0;
    payload.commits.forEach((commit) => {
      const {
        id,
        url,
        message,
        author: { username },
      } = commit;

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
      index += 1;
    });
  }

  return blocks;
};

export const getDividerBlock = () => {
  return {
    type: 'divider',
  };
};

import * as github from '@actions/github';

export const getHeaderBlocks = () => {
  const {
    context: {
      eventName,
      workflow,
      payload: {
        repository: { url },
      },
    },
  } = github;
  const { GITHUB_RUN_ID } = process.env;

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*Workflow*: <${url}/actions/runs/${GITHUB_RUN_ID}|${workflow}>     *Event*: ``${eventName}```,
      },
    },
  ];
};

export const getCommitBlocks = () => {
  const {
    context: { eventName, payload },
  } = github;

  const {
    GITHUB_ACTOR,
    GITHUB_EVENT_NAME,
    GITHUB_SHA,
    GITHUB_REF,
    GITHUB_REPOSITORY,
  } = process.env;

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
        timestamp,
      } = commit;
      const commitDate = new Date(timestamp);
      const unixTimestamp = commitDate.getTime() / 1000;

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
              alt_text: GITHUB_ACTOR,
            },
            {
              type: 'mrkdwn',
              text: `*<https://github.com/${username}|${username}>*`,
            },
            {
              type: 'mrkdwn',
              text: `*Branch*: ${GITHUB_REF.trim('/').replace(
                'refs/heads/',
                ''
              )}`,
            },
          ],
        }
      );
      index += 1;
    });
  }

  return blocks;

  // workflow: 'Main',
  // organization: // https://avatars1.githubusercontent.com/u/8423420?v=4

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<https://github.com/${GITHUB_REPOSITORY}/commit/${GITHUB_SHA}|${GITHUB_SHA.substring(
          0,
          7
        )}>*: Fixed a bunch of issues regarding SSL, SAML, and OAUTH2. Good to go.`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: `https://github.com/${GITHUB_ACTOR}.png`,
          alt_text: GITHUB_ACTOR,
        },
        {
          type: 'mrkdwn',
          text: `*<https://github.com/${GITHUB_ACTOR}|${GITHUB_ACTOR}>*`,
        },
        {
          type: 'mrkdwn',
          text: `*Branch*: ${GITHUB_REF.trim('/').replace('refs/heads/', '')}`,
        },
        {
          type: 'mrkdwn',
          text: `*Event*: ${GITHUB_EVENT_NAME}`,
        },
        {
          type: 'mrkdwn',
          text:
            '<!date^1392734382^{date_short} {time_secs}|Feb 18, 2014 6:39:42 AM PST>',
        },
      ],
    },
  ];
};

export const getDividerBlock = () => {
  return {
    type: 'divider',
  };
};

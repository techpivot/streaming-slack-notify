import * as github from '@actions/github';

export const getCommitBlocks = () => {
  const {
    GITHUB_ACTOR,
    GITHUB_EVENT_NAME,
    GITHUB_SHA,
    GITHUB_REF,
    GITHUB_REPOSITORY,
  } = process.env;

  if (github.context.eventName === 'push') {
    const pushPayload = github.context.payload;
    console.log('pushpayload', pushPayload);
    console.log('commits', pushPayload.commits);
  }


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

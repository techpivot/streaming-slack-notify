import * as github from '@actions/github';

export const getCommitBlocks = () => {
  const { eventName, sha, ref } = github.context;

  // workflow: 'Main',
  // organization: // https://avatars1.githubusercontent.com/u/8423420?v=4

  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          `*<https://github.com/techpivot/streaming-slack-notify/commit/${sha}|${sha.substring(0, 7)}>*: Fixed a bunch of issues regarding SSL, SAML, and OAUTH2. Good to go.`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: `https://github.com/${process.env.GITHUB_ACTOR}.png`,
          alt_text: process.env.GITHUB_ACTOR,
        },
        {
          type: 'mrkdwn',
          text: `*<https://github.com/${process.env.GITHUB_ACTOR}|${process.env.GITHUB_ACTOR}>*`,
        },
        {
          type: 'mrkdwn',
          text: `*Branch*: ${ref.trim('/').replace('ref/heads/', '')}`,
        },
        {
          type: 'mrkdwn',
          text: `*Event*: ${eventName}`,
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

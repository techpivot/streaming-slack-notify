import * as github from '@actions/github';

export const getCommitBlocks = () => {
  return [
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text:
          '*<https://github.com/techpivot/streaming-slack-notify/commit/f17563b10f6e0d84e8429b5a1154a0424e12f2f6|f17563b>*: Fixed a bunch of issues regarding SSL, SAML, and OAUTH2. Good to go.',
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
          text: '*<https://github.com/${process.env.GITHUB_ACTOR}|${process.env.GITHUB_ACTOR}>*',
        },
        {
          type: 'mrkdwn',
          text: `*Branch*: ${github.ref}`,
        },
        {
          type: 'mrkdwn',
          text: `*Event*: ${github.context.event_name}`,
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

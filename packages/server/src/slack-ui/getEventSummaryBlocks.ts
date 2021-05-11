import { KnownBlock, MrkdwnElement } from '@slack/types';
import { GetWorkflowRunResponseData } from '../github-poller/types';

const getPushEventDetailBlocks = (payload: PushEvent): KnownBlock[] => {
  const blocks: KnownBlock[] = [];
  const maxCommits = 1;


  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  payload.commits.slice(0, maxCommits).forEach((commit: any) => {
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

  return blocks;
};

const getPullRequestEventDetailBlocks = (payload: PullRequestEvent): KnownBlock[] => {
  const blocks: KnownBlock[] = [];

  const {
    pull_request: {
      draft,
      commits,
      title,
      body,
      html_url: prUrl,
      head: { ref: headRef },
      base: { ref: baseRef },
      user: { login, html_url },
    },
  } = payload;

  // Note 1: We're currently putting the number in the top part. Could potentially be put adjacent
  // to the title; however, in UI testing I couldn't get it to look good. Specifically, either too bold
  // or not displayed with muted contrast which is what I was going for.

  // Note 2: It appears the mergeable/rebasable information is marked as null or 'unknown' while
  // running. (Makes sense)

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `${draft ? '`DRAFT` ' : ''}*<${prUrl}|${title}>*: ${body}`,
    },
  });
  blocks.push({
    type: 'context',
    elements: [
      {
        type: 'image',
        image_url: `${html_url}.png`,
        alt_text: login,
      },
      {
        type: 'mrkdwn',
        text: `*<${html_url}|${login}>* wants to merge *${commits}* commit${
          commits !== 1 ? 's' : ''
        } into \`${baseRef}\` from \`${headRef}\``,
      },
    ],
  });

  return blocks;
};

const getEventDetailBlocks = (workflowData: GetWorkflowRunResponseData): KnownBlock[] => {
  const { event } = workflowData;

  // import { PullRequestEvent, PushEvent } from '@octokit/webhooks-definitions/schema';

  switch (event) {
    case 'push':
      return getPushEventDetailBlocks(payload as PushEvent);

    case 'pull_request':
      return getPullRequestEventDetailBlocks(payload as PullRequestEvent);

    default:
      throw new Error('Unsupported event type');
  }
};


export default getEventDetailBlocks;

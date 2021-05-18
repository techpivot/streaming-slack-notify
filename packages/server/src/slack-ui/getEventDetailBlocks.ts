import { KnownBlock } from '@slack/types';
import { components } from '@octokit/openapi-types';
import { GetWorkflowRunResponseData } from '../github-poller/types';

const getEventDetailBlocks = (
  workflowData: GetWorkflowRunResponseData,
  headCommit?: components['schemas']['commit']
): KnownBlock[] => {
  const blocks: KnownBlock[] = [];
  const {
    repository: { full_name: repofullName },
  } = workflowData;

  if (headCommit === undefined) {
    return [];
  }

  const author = headCommit.author;
  if (author === null) {
    return [];
  }

  blocks.push(
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*<https://www.github.com/${repofullName}|${repofullName}>*`,
      },
    },
    {
      type: 'context',
      elements: [
        {
          type: 'image',
          image_url: author.avatar_url,
          alt_text: author.login,
        },
        {
          type: 'mrkdwn',
          text: `*<https://github.com/${author.login}|${author.login}>*`,
        },
        {
          type: 'mrkdwn',
          text: `*<${headCommit.html_url}|${headCommit.sha.substring(0, 7)}>*: ${headCommit.commit.message.replace(
            /\.?\n+/,
            '. '
          )}`,
        },
      ],
    }
  );

  return blocks;
};

export default getEventDetailBlocks;

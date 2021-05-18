import { MessageAttachment, MrkdwnElement } from '@slack/types';
import { components } from '@octokit/openapi-types';
import { GetWorkflowRunResponseData } from '../github-poller/types';
import getDividerBlock from './getDividerBlock';

const getSummaryAttachments = (
  workflowData: GetWorkflowRunResponseData,
  pushBranchName?: string,
  pullRequest?: components['schemas']['pull-request-simple']
): MessageAttachment[] => {
  const { event, name, run_number: runNumber, html_url: htmlUrl } = workflowData;
  const elements: MrkdwnElement[] = [];
  const attachments: MessageAttachment[] = [];

  elements.push({
    type: 'mrkdwn',
    text: `<${htmlUrl}|*${name}* #${runNumber}>`,
  });
  elements.push({
    type: 'mrkdwn',
    text: `*Event*: \`${event}\`${
      pullRequest !== undefined ? ` *<${pullRequest.html_url}|#${pullRequest.number}>*` : ''
    }`,
  });

  switch (event) {
    case 'schedule':
    case 'push':
      {
        elements.push({
          type: 'mrkdwn',
          text: `*Branch*: \`${pushBranchName}\``,
        });
      }
      break;

    case 'pull_request':
      {
        if (pullRequest !== undefined) {
          elements.push({
            type: 'mrkdwn',
            text: `*Branch*: \`${pullRequest.head.ref}\``,
          });
        }
      }
      break;
  }

  attachments.push({
    color: '#fff',
    blocks: [getDividerBlock(), { type: 'context', elements }],
  });

  return attachments;
};

export default getSummaryAttachments;

import { KnownBlock } from '@slack/types';
import { GetWorkflowRunResponseData } from '../github-poller/types';
import { getReadableDurationString } from '../../../common/lib/utils';

const getTitleBlocksAndFallbackText = (
  workflowData: GetWorkflowRunResponseData
): { fallbackText: string; titleBlocks: KnownBlock[] } => {
  const {
    status,
    conclusion,
    created_at,
    updated_at,
    name,
    id,
    repository: { full_name: repoFullName },
  } = workflowData;

  let action;
  let icon = '';
  let clock = '';
  let finishTime;

  let outputFallbackText;

  switch (status) {
    case 'queued':
      action = 'is queued';
      break;

    case 'in_progress':
      action = 'is running';
      finishTime = new Date().toISOString();
      break;

    case 'completed': {
      finishTime = updated_at;

      switch (conclusion) {
        case 'success':
          icon = ':heavy_check_mark: ';
          action = 'completed successfully';
          break;

        case 'neutral':
          icon = ':white_check_mark: ';
          action = 'successfully (neutral)';
          break;

        case 'failure':
          icon = ':x: ';
          action = 'completed with errors';
          break;

        case 'cancelled':
          icon = ':x: ';
          action = 'was cancelled';
          break;

        case 'timed_out':
          icon = ':x: ';
          action = 'timed out';
          break;

        case 'action_required':
          icon = ':exclamation: ';
          action = 'failed because manual action is required';
          break;
      }
      break;
    }
  }

  // Fallback text
  outputFallbackText = `Workflow ${name} ${action}.`;

  // Get the duration
  if (finishTime) {
    const duration = getReadableDurationString(new Date(created_at), new Date(finishTime));
    clock = `      :clock3: ${duration}`;
    outputFallbackText += `  (Duration: ${duration})`;
  }

  // In order to have a better UI for continuous messages in the channel, we need a larger top divider. Currently
  // this is set to width for desktop. Without additional options, there is nothing else we can really do. The
  // divider block is being used in the commit section.

  // Temporarily disabling. Would love to get some more feedback on this
  const preDivider = '';
  // const preDivider = '══════════════════════════════════════════════════════════\n';

  return {
    fallbackText: outputFallbackText,
    titleBlocks: [
      {
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${preDivider}${icon}Workflow *<https://www.github.com/${repoFullName}/actions/runs/${id}|${name}>* ${action}.${clock}`,
        },
      },
    ],
  };
};

export default getTitleBlocksAndFallbackText;

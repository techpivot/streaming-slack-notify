import { KnownBlock } from '@slack/types';
import { GetWorkflowRunResponseData } from '../github-poller/types';
import { getReadableDurationString } from '../../../common/lib/utils';

const getHeaderBlocksAndFallbackText = (
  workflowData: GetWorkflowRunResponseData
): { fallbackText: string; headerBlocks: KnownBlock[] } => {
  const { status, conclusion, created_at, updated_at, name } = workflowData;

  let action;
  let icon = '';
  let clock = '';
  let finishTime;

  let outputFallbackText;

  switch (status) {
    case 'queued':
      icon = ':white_circle:';
      action = 'is queued';
      break;

    case 'in_progress':
      icon = ':hourglass_flowing_sand:';
      action = 'is running';
      finishTime = new Date().toISOString();
      break;

    case 'completed': {
      finishTime = updated_at;

      switch (conclusion) {
        case 'success':
          icon = ':heavy_check_mark:';
          action = 'completed successfully';
          break;

        case 'neutral':
          icon = ':white_check_mark:';
          action = 'successfully (neutral)';
          break;

        case 'failure':
          icon = ':x: ';
          action = 'completed with errors';
          break;

        case 'cancelled':
          icon = ':x:';
          action = 'was cancelled';
          break;

        case 'timed_out':
          icon = ':x:';
          action = 'timed out';
          break;

        case 'action_required':
          icon = ':exclamation:';
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

  return {
    fallbackText: outputFallbackText,
    headerBlocks: [
      {
        type: 'header',
        text: {
          type: 'plain_text',
          text: `${icon} Workflow ${name} ${action}.${clock}`,
          emoji: true,
        },
      },
    ],
  };
};

export default getHeaderBlocksAndFallbackText;

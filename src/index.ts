import { getInput } from '@actions/core';
import { TIMING_EXECUTION_LABEL } from './const';
import { postMessage, update } from './slack/api';
import { getTitleBlocks, getDividerBlock, getEventSummaryBlocks, getCommitBlocks, getJobAttachments } from './slack/ui';
import { validateInputs } from './validation';
import { getArtifacts, saveArtifacts } from './github/artifacts';
import { getWorkflowSummary } from './github/workflow';
import { KnownBlock, MessageAttachment } from '@slack/types';
import { ChatPostMessageArguments, ChatUpdateArguments } from '@slack/web-api';

async function run() {
  console.time(TIMING_EXECUTION_LABEL);

  try {
    // Just quick sanity check to make sure we have all the data we need. If not,
    // error out early on
    validateInputs();

    // Get existing artifacts which hold the resulting `ts` and `channel` required for
    // subsequent `chat.update` posts.
    let { channel, ts } = await getArtifacts();

    if (!channel) {
      channel = getInput('channel', { required: true });
    }

    // Get the current workflow summary
    const workflowSummary = await getWorkflowSummary();

    // Build payload and send to Slack
    if (ts) {
      const payload: ChatUpdateArguments = {
        channel,
        ts,
        text: 'test req',
        blocks: [].concat.apply([], [
          getTitleBlocks(),
          getEventSummaryBlocks(), // migrate to context
          getDividerBlock(),
          getCommitBlocks(),
          getDividerBlock(),
        ] as Array<any>),
        attachments: getJobAttachments(workflowSummary),
      };

      await update(payload);
    } else {
      const payload: ChatPostMessageArguments = {
        channel,
        text: 'test req',
        blocks: [].concat.apply([], [
          getTitleBlocks(),
          getEventSummaryBlocks(), // migrate to context
          getDividerBlock(),
          getCommitBlocks(),
          getDividerBlock(),
        ] as Array<any>),
        attachments: getJobAttachments(workflowSummary),
        // Optional fields (These are only applicable for the first post)
        username: getInput('username'),
        icon_url: getInput('icon_url'),
        icon_emoji: getInput('icon_emoji'),
      };

      const response = await postMessage(payload);

      await saveArtifacts(response.channel, response.ts);
    }
  } catch (error) {
    console.error(`\u001b[31;1mERROR: ${error.message || error}\u001b[0m`);
    console.timeEnd(TIMING_EXECUTION_LABEL);
    process.exit(1);
  } finally {
    console.timeEnd(TIMING_EXECUTION_LABEL);
  }
}

run();

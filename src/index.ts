import { getInput } from '@actions/core';
import { ChatPostMessageArguments, ChatUpdateArguments } from '@slack/web-api';
import { TIMING_EXECUTION_LABEL } from './const';
import { getArtifacts, saveArtifacts } from './github/artifacts';
import { getWorkflowSummary } from './github/workflow';
import { postMessage, update } from './slack/api';
import {
  getFallbackText,
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getCommitBlocks,
  getJobAttachments,
} from './slack/ui';
import { validateInputs } from './validation';

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
    const payloadBase = {
      channel,
      text: getFallbackText(workflowSummary), // fallback when using blocks
      blocks: [].concat.apply([], [
        getTitleBlocks(workflowSummary),
        getEventSummaryBlocks(),
        getDividerBlock(),
        getCommitBlocks(),
        getDividerBlock(),
      ] as Array<any>),
      attachments: getJobAttachments(workflowSummary),
    };

    if (ts) {
      const payload: ChatUpdateArguments = Object.assign({}, payloadBase, {
        ts,
      });

      await update(payload);
    } else {
      const payload: ChatPostMessageArguments = Object.assign({}, payloadBase, {
        // Optional fields (These are only applicable for the first post)
        username: getInput('username'),
        icon_url: getInput('icon_url'),
        icon_emoji: getInput('icon_emoji'),
      });

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

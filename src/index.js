import { getInput } from '@actions/core';
import { postSlackMessage } from './utils';
import { getTitleBlocks, getDividerBlock, getEventSummaryBlocks, getCommitBlocks, getJobAttachments } from './slack-ui';
import { getArtifacts, saveArtifacts } from './artifacts';
import { TIMING_EXECUTION_LABEL } from './const';
import { validateInputs } from './validation';
import { getWorkflowSummary } from './workflow';

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

    const method = !ts ? 'chat.postMessage' : 'chat.update';

    // Get the current workflow summary
    const workflowSummary = await getWorkflowSummary();

    // Build payload
    const payload = {
      channel,
      blocks: [].concat.apply(
        [],
        [
          getTitleBlocks(),
          getEventSummaryBlocks(), //migrate to context
          getDividerBlock(),
          getCommitBlocks(),
          getDividerBlock(),
        ]
      ),
      attachments: [].concat.apply([], [getJobAttachments(workflowSummary)]),
    };

    if (ts) {
      payload.ts = ts;
    } else {
      // Optional fields (These are only applicable for the first post)
      ['username', 'icon_url', 'icon_emoji'].forEach((k) => {
        const inputValue = getInput(k);
        if (inputValue) {
          payload[k] = inputValue;
        }
      });
    }


    const response = await postSlackMessage(method, payload);
    console.log('outer', response);

    return;

    let responseJson;
    await postSlackMessage(method, payload)
      .then((json) => {
        responseJson = json;
        console.log(`Successfully sent "${method}" payload for channel: ${channel}`);
      })
      .catch((error) => {
        console.error(`\u001b[31;1mERROR: ${error}\u001b[0m`);
        process.exit(1);
      });

    // Create the artifact on init
    if (!ts) {
      await saveArtifacts(responseJson.channel, responseJson.ts);
    }
  } catch (error) {
    console.error(`\u001b[31;1mERROR: ${error.message || error}\u001b[0m`);
    process.exit(1);
  } finally {
    console.timeEnd(TIMING_EXECUTION_LABEL);
  }
}

run();

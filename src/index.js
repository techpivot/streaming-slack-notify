import {
  NO_GITHUB_TOKEN,
  NO_SLACK_ACCESS_TOKEN,
  TIMING_EXECUTION_LABEL,
} from './const';
import { getInput, postSlackMessage } from './utils';
import {
  getTitleBlocks,
  getMessageText,
  getJobSummaryBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getCommitBlocks,
  getJobAttachments,
  getJobAttachments2,
} from './ui';

import {
  getSlackArtifact,
  saveSlackArtifact,
  getWorkflowSummary,
} from './github';

async function run() {
  console.time(TIMING_EXECUTION_LABEL);
  try {
    if (!process.env.SLACK_ACCESS_TOKEN) {
      throw new Error(NO_SLACK_ACCESS_TOKEN);
    }

    if (!process.env.GITHUB_TOKEN) {
      throw new Error(NO_GITHUB_TOKEN);
    }

    let { channel, ts } = await getSlackArtifact();
    const workflowSummary = await getWorkflowSummary();

    if (!channel) {
      channel = getInput('channel', { required: true });
    }

    const method = !ts ? 'chat.postMessage' : 'chat.update';

    //v1
    /*
    const payload = {
      channel,
      text: getMessageText(),
      attachments: [
        {
          color: '#000000',
          blocks: [].concat.apply(
            [],
            [
              getJobSummaryBlocks(workflowSummary),
              getDividerBlock(),
              getEventSummaryBlocks(),
              getDividerBlock(),
              getCommitBlocks(),
            ]
          ),
        },
      ],
    }; */
    // v2
    const payload = {
      channel,
     // text: getMessageText(),
      blocks: [].concat.apply(
        [],
        [getTitleBlocks(), getDividerBlock(), getEventSummaryBlocks(), getCommitBlocks(), getDividerBlock()]
      ),
      attachments: [].concat.apply(
        [],
        [
          //getJobAttachments(workflowSummary),
          getJobAttachments2(workflowSummary),
        ]
      ),
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

    let responseJson;
    await postSlackMessage(method, payload)
      .then((json) => {
        responseJson = json;
        console.log(
          `Successfully sent "${method}" payload for channel: ${channel}`
        );
      })
      .catch((error) => {
        console.error(`\u001b[31;1mERROR: ${error}\u001b[0m`);
        process.exit(1);
      });

    // Create the artifact on init
    if (!ts) {
      await saveSlackArtifact(responseJson.channel, responseJson.ts);
    }
  } catch (error) {
    console.error(`\u001b[31;1mERROR: ${error.message || error}\u001b[0m`);
    console.trace();
    process.exit(1);
  } finally {
    console.timeEnd(TIMING_EXECUTION_LABEL);
  }
}

run();

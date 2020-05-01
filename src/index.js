import { context, GitHub } from '@actions/github';
import {
  NO_GITHUB_TOKEN,
  NO_SLACK_ACCESS_TOKEN,
  TIMING_EXECUTION_LABEL,
} from './const';

import { getInput, postSlackMessage } from './utils';
import {
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getCommitBlocks,
  getJobAttachments,
} from './ui';
import {  getArtifacts, saveArtifacts } from './artifacts';
import { getWorkflowSummary } from './github';

async function run() {
  console.time(TIMING_EXECUTION_LABEL);

  try {
    const { SLACK_ACCESS_TOKEN, GITHUB_TOKEN } = process.env;

    if (!SLACK_ACCESS_TOKEN) {
      throw new Error(NO_SLACK_ACCESS_TOKEN);
    }
    if (!GITHUB_TOKEN) {
      throw new Error(NO_GITHUB_TOKEN);
    }



    // create a new github client

    const octokit = new GitHub(GITHUB_TOKEN);

    console.log('client');

  // current WORKFLOW:    github.context.workflow    ||  'Main'
  // current RUN_ID:      process.env.GITHUB_RUN_ID  ||  '90637811'
  // current JOB:         process.env.GITHUB_JOB     ||  'init'
  console.time('test1');
  console.time('total');

  const { owner, repo } = context.repo;
  const workflowRun = await octokit.actions.getWorkflowRun({
    owner,
    repo,
    run_id: process.env.GITHUB_RUN_ID,
  });
  console.timeEnd('test1');
  console.time('test2');
  const jobs = await octokit.actions.listJobsForWorkflowRun({
    owner,
    repo,
    run_id: process.env.GITHUB_RUN_ID,
  });

  console.log('good', jobs.data.jobs);

  console.timeEnd('test2');
  console.timeEnd('total');
  return;




    return;
    let { channel, ts } = await getArtifacts();
    const workflowSummary = await getWorkflowSummary();

    if (!channel) {
      channel = getInput('channel', { required: true });
    }

    const method = !ts ? 'chat.postMessage' : 'chat.update';

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

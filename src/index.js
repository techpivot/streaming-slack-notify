import { context, GitHub } from '@actions/github';
import { getInput, startGroup, endGroup } from '@actions/core';


import { postSlackMessage } from './utils';
import {
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getCommitBlocks,
  getJobAttachments,
} from './slack-ui';
import { getArtifacts, saveArtifacts } from './artifacts';
import {  TIMING_EXECUTION_LABEL } from './const';
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


    console.time('workflow');
    const workflow = await getWorkflowSummary();
    console.timeEnd('workflow');
    startGroup('workflow');
    console.log(workflow);
    endGroup();

    return;




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



    return;

    // create a new github client


    console.log('client');

    // current WORKFLOW:    github.context.workflow    ||  'Main'
    // current RUN_ID:      process.env.GITHUB_RUN_ID  ||  '90637811'
    // current JOB:         process.env.GITHUB_JOB     ||  'init'
    console.time('test1');
    console.time('total');

    const { owner, repo } = context.repo;


    console.log(workflowRun.data);
    endGroup();
    console.timeEnd('test2');
    console.timeEnd('total');

    console.debug('JOB_STATUS', getInput('JOB_STATUS'));


    startGroup('debug1 | github');
    console.debug(JSON.stringify(getInput('debug1') || {}, null, 2));
    endGroup();
    startGroup('debug2 | job');
    console.debug(JSON.stringify(getInput('debug2') || {}, null, 2));
    endGroup();
    startGroup('debug3 | steps');
    console.debug(JSON.stringify(getInput('debug3') || {}, null, 2));
    endGroup();
    startGroup('debug4 | runner');
    console.debug(JSON.stringify(getInput('debug4') || {}, null, 2));
    endGroup();
    startGroup('debug5 | strategy');
    console.debug(JSON.stringify(getInput('debug5') || {}, null, 2));
    endGroup();
    startGroup('debug6 | matrix');
    console.debug(JSON.stringify(getInput('debug6') || {}, null, 2));
    endGroup();


    //console.log(getInput('INTERNAL_STATUS_SUCCESS', { required: true }));
   // console.log(getInput('INTERNAL_STATUS_FAILURE', { required: true }));

    //return;


    // const workflowSummary = await getWorkflowSummary();





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

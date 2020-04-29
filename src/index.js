import { NO_SLACK_ACCESS_TOKEN, TIMING_EXECUTION_LABEL } from './const';
import {
  getInput,
  postSlackMessage,
  getSlackArtifact,
  saveSlackArtifact,
  doRequest2,
  getGithubHttpClient
} from './utils';
import {
  getMessageText,
  getDividerBlock,
  getHeaderBlocks,
  getCommitBlocks,
} from './ui';

import * as github from '@actions/github';



async function run() {
  console.time(TIMING_EXECUTION_LABEL);
  try {
    if (!process.env.SLACK_ACCESS_TOKEN) {
      throw new Error(NO_SLACK_ACCESS_TOKEN);
    }

    let { channel, ts } = await getSlackArtifact();

    if (!channel) {
      channel = getInput('channel', { required: true });
    }

    const method = !ts ? 'chat.postMessage' : 'chat.update';

    //console.log(JSON.stringify(github.context));
    //console.dir(process.env);

    // current WORKFLOW:    github.context.workflow    ||  'Main'
    // current RUN_ID:      process.env.GITHUB_RUN_ID  ||  '90637811'
    // current JOB:         process.env.GITHUB_JOB     ||  'init'


    console.log('getting client 1');
    const httpClient = getGithubHttpClient(getInput('repo-token'));
    const resp = await httpClient.getJson(
      `https://api.github.com/repos/techpivot/streaming-slack-notify/actions/runs/${process.env.GITHUB_RUN_ID}/jobs`
    );
    console.log(resp.result.jobs);
    console.log('getting client 2');
    const httpClient2 = getGithubHttpClient(getInput('repo-token'));
    const resp2 = await httpClient2.getJson(
      `https://api.github.com/repos/techpivot/streaming-slack-notify/actions/runs/${process.env.GITHUB_RUN_ID}/jobs`
    );
    console.log(resp2.result.jobs);
    console.log('getting client 3');

    return;
    const response = await doRequest2(getInput('repo-token'));

    console.log(response.result.jobs);
    console.log(response.result.jobs[0].steps);
  //  const body = response..then(json => {
//      console.log('inner', json);
    //});
    console.log('GOOOD');



    const payload = {
      channel,
      text: getMessageText(),
      attachments: [
        {
          color: '#000000',
          blocks: [].concat.apply(
            [],
            [getHeaderBlocks(), getDividerBlock(), getCommitBlocks()]
          ),
        },
      ],
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
    process.exit(1);
  } finally {
    console.timeEnd(TIMING_EXECUTION_LABEL);
  }
}

run();

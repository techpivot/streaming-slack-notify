import { NO_SLACK_ACCESS_TOKEN, TIMING_EXECUTION_LABEL } from './const';
import {
  getInput,
  postSlackMessage,
  getSlackArtifact,
  saveSlackArtifact,
} from './utils';
import {
  getMessageText,
  getDividerBlock,
  getHeaderBlocks,
  getCommitBlocks,
} from './ui';


 const doRequest2 = () => {
  const endpoint = url.parse(`https://api.github.com/repos/techpivot/streaming-slack-notify/actions/workflows/${process.env.GITHUB_RUN_ID}/runs`);
  const options = {
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: endpoint.pathname,
    method: 'GET',
  };

  console.debug('options', options);

  return new Promise((resolve, reject) => {
    const request = https.request(options, (response) => {
      let body = '';

      response.on('data', (chunk) => {
        body += chunk;
      });

      response.on('end', () => {
        if (response.statusCode !== 200) {
          printHttpError(body, response.statusCode, body);
          process.exit(1);
        }

        try {
          const json = JSON.parse(body);

          if (json.ok) {
            resolve(json);
          } else if (json.error) {
            let error = json.error;
            reject(`Error: ${error}`);
          } else {
            reject(`Unable to post message: ${body}`);
          }
        } catch (e) {
          reject(`Unable to parse response body as JSON: ${body}`);
        }
      });
    });

    request.on('error', (error) => {
      printHttpError(error.message || error);
      reject(error.message || error);
      process.exit(1);
    });
    request.end();
  });
};


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


    doRequest2();



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

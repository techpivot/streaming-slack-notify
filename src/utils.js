import fs from 'fs';
import https from 'https';
import url from 'url';
import { create } from '@actions/artifact';
import { ARTIFACT_NAME } from './const';

export function getInput(name, options = {}) {
  const val = (
    process.env[`INPUT_${name.replace(/ /g, '_').toUpperCase()}`] || ''
  ).trim();

  if (options && options.required && val.length === 0) {
    throw new Error(`Input required and not supplied: ${name}`);
  }

  return val;
}

export function printHttpError(errorMessage, statusCode = null, body = null) {
  console.error(
    `ERROR: Unable to post message to Slack${
      errorMessage !== null ? ': ' + errorMessage : ''
    }\n`
  );
  console.error(`Response Code: ${statusCode}`);
  console.error(`Response Body: ${body}`);
}

const doRequest = (method, payload) => {
  const data = JSON.stringify(payload);
  const endpoint = url.parse(`https://slack.com//api/${method}`);
  const options = {
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: endpoint.pathname,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${process.env.SLACK_ACCESS_TOKEN}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length,
    },
  };

  console.debug('payload', payload);

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
            if (json.response_metadata && json.response_metadata.messages) {
              error += `: ${json.response_metadata.messages[0]}`;
            } else {
              error += ` ${JSON.stringify(json)}`;
            }
            reject(`Slack Error: ${error}`);
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
    request.write(data);
    request.end();
  });
};

export const postSlackMessage = async (method, payload) => {
  return await doRequest(method, payload);
};

export const saveSlackArtifact = async (channel, timestamp) => {
  console.time('Upload artifact');

  try {
    fs.writeFileSync('/tmp/channel.txt', channel);
    fs.writeFileSync('/tmp/ts.txt', timestamp);
    const artifactClient = create();

    await artifactClient.uploadArtifact(
      ARTIFACT_NAME,
      ['/tmp/channel.txt', '/tmp/ts.txt'],
      '/tmp'
    );
  } finally {
    console.timeEnd('Upload artifact');
  }
};

/**
 * Returns the string timestamp or null.
 *
 * @return object { ts, channel } The values are null if not specified
 */
export const getSlackArtifact = async () => {
  console.time('Download artifact');

  try {
    const artifactClient = create();

    // Note: We call this every load and thus the very first time, there may not exist
    // an artifact yet. This allows us to write simpler Github actions without having
    // to proxy input/output inbetween all other steps.
    await artifactClient.downloadArtifact(ARTIFACT_NAME, '/tmp');

    return {
      channel: fs.readFileSync('/tmp/channel.txt', {
        encoding: 'utf8',
        flag: 'r',
      }),
      ts: fs.readFileSync('/tmp/ts.txt', { encoding: 'utf8', flag: 'r' }),
    };
  } catch (error) {
    // This is okay. error = "Unable to find any artifacts for the associated workflow"
    return {
      channel: null,
      ts: null,
    };
  } finally {
    console.timeEnd('Download artifact');
  }
};






export const doRequest2 = (token) => {
  const endpoint = url.parse(`https://api.github.com/repos/techpivot/streaming-slack-notify/actions/workflows/${process.env.GITHUB_RUN_ID}/runs`);
  const options = {
    hostname: endpoint.hostname,
    port: 443,
    path: endpoint.pathname,
    method: 'GET',
    headers: {
      Authorization: `Bearer ${token}`,
    },
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
import { startGroup, endGroup } from '@actions/core';
import { HttpClient } from '@actions/http-client';
import { getSlackToken } from './utils';
import axios from 'axios';

export const postSlackMessage = async (method: String, payload: String): Promise<object> => {
  startGroup('Slack Payload');
  console.debug(JSON.stringify(payload, null, 2));
  endGroup();

  console.time('Slack timing');

  const data = JSON.stringify(payload);

  const response = await axios.post(`https://slack.com//api/${method}`, data, {
    headers: {
      Authorization: `Bearer ${getSlackToken()}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length,
    },
  });

  console.log(response);

  const { status, data: jsonBody} = response;

  console.timeEnd('Slack timing');

  console.debug(`Response Status Code: ${status}`);

  let error;
  if (jsonBody && jsonBody.error) {
    error = jsonBody.error;
    if (jsonBody.response_metadata && jsonBody.response_metadata.messages) {
      error += `: ${jsonBody.response_metadata.messages[0]}`;
    }
  }

  if (status !== 200 || error != undefined) {
    throw new Error(`Unable to post message to Slack${error !== null ? ': ' + error : ''}\n`);
  }

  return jsonBody;

  /*
  const data = JSON.stringify(payload);
  const endpoint = url.parse(`https://slack.com//api/${method}`);
  const options = {
    hostname: endpoint.hostname,
    port: endpoint.port,
    path: endpoint.pathname,
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getSlackToken()}`,
      'Content-Type': 'application/json; charset=utf-8',
      'Content-Length': data.length,
    },
  };



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
  }); */
};

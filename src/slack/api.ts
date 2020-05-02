import { startGroup, endGroup } from '@actions/core';
import { getSlackToken } from '../utils';
import axios from 'axios';

export const postSlackMessage = async (method: string, payload: string): Promise<object> => {
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

  const { status, data: jsonBody } = response;
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
};

import { startGroup, endGroup } from '@actions/core';
import { getSlackToken } from '../utils';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient, WebAPICallResult } from '@slack/web-api';

export interface ChatPostMessageResult extends WebAPICallResult {
  channel: string;
  ts: string;
  message: {
    text: string;
  };
}

const isPayloadChatUpdate = (payload: ChatPostMessageArguments | ChatUpdateArguments): payload is ChatUpdateArguments =>
  payload.ts !== undefined;

const send = async (
  method: string,
  payload: ChatPostMessageArguments | ChatUpdateArguments
): Promise<WebAPICallResult> => {
  startGroup('Slack Payload');
  console.debug(JSON.stringify(payload, null, 2));
  endGroup();

  console.time('Slack timing');

  const client = new WebClient(getSlackToken());
  let response;

  if (isPayloadChatUpdate(payload)) {
    response = await client.chat.update(payload);
  } else {
    response = (await client.chat.postMessage(payload)) as ChatPostMessageResult;
  }

  console.timeEnd('Slack timing');

  console.log(response);

  /*
    let error;
  if (jsonBody && jsonBody.error) {
    error = jsonBody.error;
    if (jsonBody.response_metadata && jsonBody.response_metadata.messages) {
      error += `: ${jsonBody.response_metadata.messages[0]}`;
    }
  }

  if (status !== 200 || error != undefined) {
    throw new Error(`Unable to post message to Slack${error !== null ? ': ' + error : ''}\n`);
  }*/

  return response;
};

export const postMessage = async (payload: ChatPostMessageArguments): Promise<ChatPostMessageResult> => {
  return (await send('postMessage', payload)) as ChatPostMessageResult;
};

export const update = async (payload: ChatUpdateArguments): Promise<WebAPICallResult> => {
  return await send('update', payload);
};

/*


export const postSlackMessage = async (method: string, payload: string): Promise<object> => {
  startGroup('Slack Payload');
  console.debug(JSON.stringify(payload, null, 2));
  endGroup();

  console.time('Slack timing');

  const data = JSON.stringify(payload);

  const client = new WebClient(getSlackToken());



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
*/

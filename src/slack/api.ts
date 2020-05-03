import { startGroup, endGroup } from '@actions/core';
import { getSlackToken } from '../utils';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient, WebAPICallResult } from '@slack/web-api';

export interface ChatResponse extends WebAPICallResult {
  ok: boolean,
  error?: string,
  channel: string;
  ts: string;
  message: {
    text: string;
  };
  response_metadata?: {
    messages?: string[];
  }
}

const isPayloadChatUpdate = (payload: ChatPostMessageArguments | ChatUpdateArguments): payload is ChatUpdateArguments =>
  payload.ts !== undefined;

const send = async (
  method: string,
  payload: ChatPostMessageArguments | ChatUpdateArguments
): Promise<ChatResponse> => {
  startGroup('Slack Payload');
  console.debug(JSON.stringify(payload, null, 2));
  endGroup();

  console.time('Slack API timing');

  const client = new WebClient(getSlackToken());
  let response;

  if (isPayloadChatUpdate(payload)) {
    response = (await client.chat.update(payload)) as ChatResponse;
  } else {
    response = (await client.chat.postMessage(payload)) as ChatResponse;
  }

  console.timeEnd('Slack API timing');

  console.log(response);

  let error;
  if (response.error) {
    error = response.error;
    if (response.response_metadata && response.response_metadata.messages) {
      error += `: ${response.response_metadata.messages[0]}`;
    }
  }

  if (error != undefined) {
    throw new Error(`Unable to post message to Slack${error !== null ? ': ' + error : ''}\n`);
  }

  return response;
};

export const postMessage = async (payload: ChatPostMessageArguments): Promise<ChatResponse> => {
  return await send('postMessage', payload);
};

export const update = async (payload: ChatUpdateArguments): Promise<ChatResponse> => {
  return await send('update', payload);
};

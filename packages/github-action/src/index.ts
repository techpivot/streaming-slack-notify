import { setFailed, getInput } from '@actions/core';
import * as github from '@actions/github';
import axios, { AxiosError, AxiosResponse } from 'axios';
import { ApiGithubActionRequestData, ApiGithubActionResponseData } from '../../common/lib/types';
import { API_ENDPOINT } from '../../common/lib/const';

const getOptionalInput = (key: string, returnVal: string | undefined): string | undefined => {
  const value = getInput(key);

  return value === '' ? returnVal : value;
};

const getPostData = (): ApiGithubActionRequestData => {
  const { GITHUB_REPOSITORY, GITHUB_RUN_ID } = process.env;

  if (GITHUB_REPOSITORY === undefined) {
    throw new Error('Unable to determine GitHub repository name: No GITHUB_REPOSITORY environment variable defined');
  }

  if (!GITHUB_RUN_ID) {
    throw new Error('Unable to determine run ID: No GITHUB_RUN_ID environment variable defined');
  }

  const repoArr = GITHUB_REPOSITORY.split('/', 2);

  return {
    channel: getInput('channel', { required: true }),
    username: getOptionalInput('username', undefined),
    iconUrl: getOptionalInput('icon_url', undefined),
    iconEmoji: getOptionalInput('icon_emoji', undefined),
    githubToken: getInput('GITHUB_TOKEN', { required: true }),
    appToken: getInput('slack_app_token', { required: true }),
    github: {
      payload: github.context.payload,
      eventName: github.context.eventName,
      workflowName: github.context.workflow,
      runId: GITHUB_RUN_ID,
      repository: {
        owner: repoArr[0],
        repo: repoArr[1],
      },
    },
  };
};

async function run() {
  try {
    const postData: ApiGithubActionRequestData = getPostData();
    const response: AxiosResponse = await axios.post(API_ENDPOINT, postData);

    // No need to display anything. Queued and streaming will begin
    console.log('Successfully added Workflow run to the queue');

    return response;
  } catch (error) {
    if (error.isAxiosError) {
      const axiosError: AxiosError = error;
      const { response } = axiosError;

      let errorMessage = 'Unknown error';
      if (response !== undefined) {
        const { status, statusText } = response;

        // Note: Axios automatically convers JSON responses.
        const data = response.data as ApiGithubActionResponseData;
        if (data.error && data.error.name && data.error.message) {
          errorMessage = `[${data.error.name}] ${data.error.message}`;
        }
        console.error(`[${status}] ${statusText}`);
      }

      setFailed(`Unable to post to API endpoint: ${errorMessage}`);
    } else {
      setFailed(error);
    }
  }
}

run();

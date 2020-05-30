import { getInput } from '@actions/core';
import * as github from '@actions/github';
import axios, { AxiosResponse } from 'axios';
import { ApiGithubActionRequestData } from '../../common/lib/interfaces';
import { API_ENDPOINT } from '../../common/lib/const';

async function run() {
  const { GITHUB_REPOSITORY } = process.env;
  const { GITHUB_RUN_ID } = process.env;

  if (GITHUB_REPOSITORY === undefined) {
    throw new Error('Unable to determine GitHub repository name: No GITHUB_REPOSITORY environment variable defined');
  }

  if (!GITHUB_RUN_ID) {
    throw new Error('Unable to determine run ID: No GITHUB_RUN_ID environment variable defined');
  }

  const repoArr = GITHUB_REPOSITORY.split('/', 2);

  const postData: ApiGithubActionRequestData = {
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

  console.log('ApiGithubActionRequestData', postData);

  try {
    // fetch data from a url endpoint
    const response: AxiosResponse = await axios.post(API_ENDPOINT, postData);
    console.log('data', response);
  //  const json = await response.json();
    return response;
  } catch(error) {
    console.log("error", error);
    // appropriately handle the error
  }
}

run();

import { getInput } from '@actions/core';
import * as github from '@actions/github';
import { ApiGithubActionRequestData } from '../../common/lib/interfaces';

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

  const post: ApiGithubActionRequestData = {
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

  console.log('ApiGithubActionRequestData', post);
}

run();

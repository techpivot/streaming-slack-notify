import * as github from '@actions/github';
//import { GitHubWorkflowRunData } from '../../common/lib/interfaces';

async function run() {
  const { GITHUB_REPOSITORY } = process.env;
  const { GITHUB_RUN_ID } = process.env;

  if (GITHUB_REPOSITORY === undefined) {
    throw new Error('Unable to determine GitHub repository name: No GITHUB_REPOSITORY environment variable defined');
  }

  if (!GITHUB_RUN_ID) {
    throw new Error('Unable to determine run ID: No GITHUB_RUN_ID environment variable defined');
  }

  //  console.time(TIMING_EXECUTION_LABEL);
  console.log('payload', JSON.stringify(github.context.payload, null, 2));

  console.log('eventname', github.context.eventName);

  console.log('workflowName', github.context.workflow);

  console.log('runId', GITHUB_RUN_ID);

  const repoArr = GITHUB_REPOSITORY.split('/', 2);
  console.log('repository', {
    owner: repoArr[0],
    repo: repoArr[1],
  });
}

run();

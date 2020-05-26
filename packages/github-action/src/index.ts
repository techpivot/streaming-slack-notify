import * as github from '@actions/github';

async function run() {
  //  console.time(TIMING_EXECUTION_LABEL);
  console.log(JSON.stringify(github.context, null, 2));
}

run();

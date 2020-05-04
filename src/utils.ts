import { getInput } from '@actions/core';
import { context } from '@actions/github';

interface GitHubRepositoryInterface {
  owner: string;
  repo: string;
}

type JobContextStatus = 'Success' | 'Failure' | 'Cancelled';

export const getGithubToken = (): string => {
  const token = getInput('GITHUB_TOKEN');

  if (token === '') {
    throw new Error('GITHUB_TOKEN input variable is undefined');
  }

  return token;
};

export const getJobContextName = (): string => {
  const name = getInput('CURRENT_JOB_STATUS');
  if (name === '') {
    throw new Error('CURRENT_JOB_STATUS input variable is undefined');
  }

  return name;
};

export const getJobContextStatus = (): JobContextStatus => {
  const jobStatus = getInput('CURRENT_JOB_STATUS');

  switch (jobStatus) {
    case 'Success':
    case 'Failure':
    case 'Cancelled':
      break;

    case '':
      throw new Error('CURRENT_JOB_STATUS input variable is undefined');

    default:
      throw new Error(`Unexpected JOB_STATUS value: ${jobStatus}`);
  }

  return jobStatus;
};

export const getSlackToken = (): string => {
  const token = getInput('slack_access_token');

  if (token === '') {
    throw new Error('slack_access_token input variable is undefined');
  }

  return token;
};

export const isFinalStep = (): boolean => {
  const isFinalStep = getInput('is_final_step');

  return isFinalStep.toLowerCase() === 'true';
};

export const getGithubRepository = (): GitHubRepositoryInterface => {
  const { owner, repo } = context.repo;

  return {
    owner,
    repo,
  };
};

export const getGithubRepositoryFullName = (): string => {
  const { GITHUB_REPOSITORY } = process.env;

  if (!GITHUB_REPOSITORY) {
    throw new Error('Unable to determine current GitHub repository full name');
  }

  return GITHUB_REPOSITORY;
};

export const getGithubRepositoryUrl = (): string => {
  return `https://github.com/${getGithubRepositoryFullName()}`;
};

export const getActionEventName = (): string => {
  const { eventName } = context;

  return eventName;
};

export const getActionBranch = (): string => {
  const { ref } = context;

  return ref.replace('refs/heads/', '');
};

export const getGithubRunId = (): number => {
  const { GITHUB_RUN_ID } = process.env;

  if (!GITHUB_RUN_ID) {
    throw new Error('Unable to determine current run ID: No GITHUB_RUN_ID environment variable set');
  }

  return parseInt(GITHUB_RUN_ID, 10);
};

export const getWorkflowName = (): string => {
  const { workflow } = context;

  return workflow;
};

export const getReadableDurationString = (dateOne: Date, dateTwo: Date): string => {
  let d, h, m, s;

  s = Math.floor(Math.abs(dateOne.getTime() - dateTwo.getTime()) / 1000);
  m = Math.floor(s / 60);
  s = s % 60;
  h = Math.floor(m / 60);
  m = m % 60;
  d = Math.floor(h / 24);
  h = h % 24;

  const result = [];
  if (d > 0) {
    result.push(`${d}d`);
  }
  if (h > 0) {
    result.push(`${h}h`);
  }
  if (m > 0) {
    result.push(`${m}m`);
  }
  if (s > 0) {
    result.push(`${s}s`);
  }

  return result.join(' ');
};

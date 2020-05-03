import { NO_GITHUB_TOKEN, NO_SLACK_ACCESS_TOKEN, NO_JOB_STATUS } from './const';
import { getSlackToken, getGithubToken, getJobContextStatus } from './utils';

export const validateInputs = (): void => {
  if (getSlackToken() === '') {
    throw new Error(NO_SLACK_ACCESS_TOKEN);
  }

  try {
    getGithubToken();
  } catch (error) {
    throw new Error(NO_GITHUB_TOKEN);
  }

  try {
    getJobContextStatus();
  } catch (error) {
    throw new Error(NO_JOB_STATUS);
  }
};

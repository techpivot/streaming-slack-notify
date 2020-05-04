import { NO_GITHUB_TOKEN, NO_SLACK_ACCESS_TOKEN, NO_CURRENT_JOB_STATUS } from './const';
import { getSlackToken, getGithubToken, getJobContextStatus, getJobContextName } from './utils';

export const validateInputs = (): void => {
  try {
    getSlackToken();
  } catch (error) {
    throw new Error(NO_GITHUB_TOKEN);
  }

  try {
    getGithubToken();
  } catch (error) {
    throw new Error(NO_GITHUB_TOKEN);
  }

  try {
    getJobContextStatus();
  } catch (error) {
    throw new Error(NO_CURRENT_JOB_STATUS);
  }

  try {
    getJobContextName();
  } catch (error) {
    throw new Error(NO_CURRENT_JOB_STATUS);
  }
};

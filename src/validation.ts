import { NO_GITHUB_TOKEN, NO_SLACK_ACCESS_TOKEN } from './const';
import { getSlackToken, getGithubToken } from './utils';

export const validateInputs = (): void => {
  if (getSlackToken() === '') {
    throw new Error(NO_SLACK_ACCESS_TOKEN);
  }
  if (!getGithubToken()) {
    throw new Error(NO_GITHUB_TOKEN);
  }
};

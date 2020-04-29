import { getInput } from './utils';
import * as github from '@actions/github';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/auth';

export default new HttpClient('action/workflow', [
  new BearerCredentialHandler(github.context.token),
  //new BearerCredentialHandler(getInput('repo-token')),
]);

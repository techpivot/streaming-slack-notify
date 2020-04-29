import { getInput } from './utils';
import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/auth';


export default new HttpClient('action/workflow', [
  new BearerCredentialHandler(getInput('repo-token')),
]);

import { HttpClient } from '@actions/http-client';
import { BearerCredentialHandler } from '@actions/http-client/auth';

export default new HttpClient('action/workflow', [
  new BearerCredentialHandler(process.env.GITHUB_TOKEN),
]);

import { createAppAuth } from '@octokit/auth-app';
import { Octokit } from '@octokit/rest';
import { components } from '@octokit/openapi-types';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient } from '@slack/web-api';
import { KnownBlock, MessageAttachment } from '@slack/types';
import { SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
import Debug, { Debugger } from 'debug';
import { GITHUB_APP_ID, GITHUB_CLIENT_ID } from '../../../common/lib/const';
import { SQSBody } from '../../../common/lib/types';
import { getMemoryUsageMb, getReadableDurationString, sleep } from '../../../common/lib/utils';
import { ListJobsForWorkflowRunResponseData, GetWorkflowRunResponseData, SlackChatPostMessageResponse } from './types';
import {
  getEventDetailBlocks,
  getJobAttachments,
  getHeaderBlocksAndFallbackText,
  getSummaryAttachments,
} from '../slack-ui';

export default class Poller {
  startTime: Date;
  running = false;
  debug: Debugger;

  // Time in ms between updates. Note the actual loop time is longer because we need to add the query time
  // to github and then the query time to post the message to slack. This typically adds around another 200-750ms.
  defaultIntervalTime = 1500;
  nextIntervalTime: number = this.defaultIntervalTime;

  // SQS
  sqs: SQS;
  sqsQueueUrl: string;
  sqsMessageBody: SQSBody;

  // Clients
  octokit: Octokit;
  slackClient: WebClient;

  // Query Cache for additional data
  commitCache: { [key: string]: components['schemas']['commit'] } = {};
  pushBranchCache: { [key: string]: string } = {};
  pullRequestCache: { [key: string]: components['schemas']['pull-request-simple'] } = {};

  constructor(
    githubAppClientSecret: string,
    githubAppPrivateKey: string,
    sqs: SQS,
    sqsQueueUrl: string,
    sqsMessageBody: SQSBody
  ) {
    const { slackAccessToken, githubInstallationId, githubOrganization, githubRepository, githubWorkflowRunId } =
      sqsMessageBody;

    this.startTime = new Date();
    this.sqs = sqs;
    this.sqsQueueUrl = sqsQueueUrl;
    this.sqsMessageBody = sqsMessageBody;
    this.debug = Debug(`poller[${githubOrganization}/${githubRepository}/${githubWorkflowRunId}]`);

    this.log('Initializing new Octokit instance ...');
    this.octokit = new Octokit({
      authStrategy: createAppAuth,
      auth: {
        appId: GITHUB_APP_ID,
        privateKey: githubAppPrivateKey,
        clientId: GITHUB_CLIENT_ID,
        clientSecret: githubAppClientSecret,
        installationId: githubInstallationId,
      },
    });
    this.log('✓ Octokit instance initialized');

    this.log('Initializing new Slack web client...');
    this.slackClient = new WebClient(slackAccessToken);
    this.log('✓ Slack web client initialized');
  }

  log(message: string): void {
    this.debug(message);
  }

  logError(error: Error): void {
    this.debug(`[ERROR] ${error}`);
    console.error(`[ERROR] ${error}`);
    if (error.stack) {
      console.error(error.stack);
    }
  }

  async run(ee: EventEmitter): Promise<void> {
    this.running = true;

    const drain = async (signal: string) => {
      await this.drain(signal);
    };

    try {
      ee.on('drain', drain);

      const { githubOrganization, githubRepository, githubWorkflowRunId } = this.sqsMessageBody;

      this.log(`Starting GitHub workflow poller: ${githubOrganization}/${githubRepository}/${githubWorkflowRunId}`);
      this.log(`Current Node Memory Usage: ${getMemoryUsageMb()} MB`);

      let i = 0;
      while (this.running) {
        this.debug(`Poll Loop #'${++i}`);
        const { jobsData, workflowData, headCommit, pushBranchName, pullRequest } = await this.queryGitHub();
        await this.postToSlack(jobsData, workflowData, headCommit, pushBranchName, pullRequest);

        /*
        // If the last job was successful, it takes about 200ms to mark workflow complete. So instead of waiting
        // 1 to 2 seconds, decrease the interval time.
        const lastJob = summary.jobsData.jobs[summary.jobsData.jobs.length];
        if (lastJob !== undefined && lastJob.status === 'completed') {
          debug('Decreasing interval time to 250ms');
          this.nextIntervalTime = 250;
        }
        */
        if (workflowData.status === 'completed') {
          break;
        }

        await sleep(this.nextIntervalTime);
      }

      if (this.running) {
        this.log('GitHub workflow complete');
      }
    } catch (err) {
      // This error could potentially be streamed back into the MESSAGE
      this.logError(err);
    } finally {
      ee.off('drain', drain);
      this.log(`Poller completed in ${getReadableDurationString(this.startTime, new Date())}`);
      this.running = false;
    }
  }

  async queryGitHub(): Promise<{
    jobsData: ListJobsForWorkflowRunResponseData;
    workflowData: GetWorkflowRunResponseData;
    headCommit?: components['schemas']['commit'];
    pushBranchName?: string;
    pullRequest?: components['schemas']['pull-request-simple'];
  }> {
    this.debug('Querying GitHub');

    const { githubOrganization, githubRepository, githubWorkflowRunId } = this.sqsMessageBody;
    const opts = { run_id: githubWorkflowRunId, owner: githubOrganization, repo: githubRepository };

    const [workflow, jobs] = await Promise.all([
      // Required Permissions:  Actions/Read-only
      this.octokit.actions.getWorkflowRun(opts),
      // Required Permissions:  Actions/Read-only
      this.octokit.actions.listJobsForWorkflowRun(opts),
    ]);

    let queryTotal = 2;
    const ci = workflow.data.head_commit?.id;
    const event = workflow.data.event;
    let headCommit;
    let pushBranchName;
    let pullRequest;

    if (ci) {
      // We cache the results of the branch lookup and the commit lookup as these shouldn't* ever change
      // for all intensive purposes (at least during a single workflow run). This way the first
      // GitHub query has 2 extra queries.
      if (!this.commitCache[ci]) {
        queryTotal += 2;
        [headCommit, pushBranchName, pullRequest] = await Promise.all([
          // Required Permissions:  Contents/Read-only
          this.octokit.repos.getCommit({
            owner: githubOrganization,
            repo: githubRepository,
            ref: ci,
          }),

          // Required Permissions:  Contents/Read-only
          event === 'push'
            ? this.octokit.repos.listBranchesForHeadCommit({
                owner: githubOrganization,
                repo: githubRepository,
                commit_sha: ci,
              })
            : null,

          // Required Permissions:  Pull Requests/Read-only
          event === 'pull_request'
            ? this.octokit.repos.listPullRequestsAssociatedWithCommit({
                owner: githubOrganization,
                repo: githubRepository,
                commit_sha: ci,
              })
            : null,
        ]);

        this.commitCache[ci] = headCommit?.data;

        if (pushBranchName) {
          this.pushBranchCache[ci] = pushBranchName?.data.slice(-1)[0].name;
        }
        if (pullRequest && pullRequest.data) {
          this.pullRequestCache[ci] = pullRequest.data[0];
        }
      }

      headCommit = this.commitCache[ci];
      pushBranchName = this.pushBranchCache[ci];
      pullRequest = this.pullRequestCache[ci];
    }

    // Rate Limits: Currently, we query 2 endpoints using REST API v3. Thus, take into account the
    // poll frequency based on the follwing data:

    //  "x-ratelimit-limit": "5000",        // The maximum number of requests you're permitted to make per hour.
    //  "x-ratelimit-remaining": "4995",    // Remaining	The number of requests remaining in the current rate limit window.
    //  "x-ratelimit-reset": "1590444834",  // The time at which the current rate limit window resets in UTC epoch seconds.

    // Some Notes:
    //  Rate limit for public unauth requests = 60
    //  Rate limit for GitHub Actions token = 1000
    //  Rate limit for Personal Access token = 5000
    //  Rate limit for application

    const remaining1: number = parseInt(jobs.headers['x-ratelimit-remaining'] || '', 10);
    const remaining2: number = parseInt(workflow.headers['x-ratelimit-remaining'] || '', 10);
    this.debug(
      `GitHub RateLimit: ${jobs.headers['x-ratelimit-limit']} req/hour (Remaining: ${Math.min(
        remaining1,
        remaining2
      )}) (Queries: ${queryTotal})`
    );

    return {
      jobsData: jobs.data,
      workflowData: workflow.data,
      headCommit,
      pushBranchName,
      pullRequest,
    };
  }

  async postToSlack(
    jobsData: ListJobsForWorkflowRunResponseData,
    workflowData: GetWorkflowRunResponseData,
    headCommit?: components['schemas']['commit'],
    pushBranchName?: string,
    pullRequest?: components['schemas']['pull-request-simple']
  ): Promise<void> {
    const { slackChannel, slackBotUsername, slackTimestamp } = this.sqsMessageBody;

    // Build payload and send to Slack
    this.log('Building Slack payload');

    const { headerBlocks, fallbackText } = getHeaderBlocksAndFallbackText(workflowData);

    const payloadBase = {
      channel: slackChannel,
      text: fallbackText,
      blocks: ([] as KnownBlock[]).concat(
        ...headerBlocks,
        ...getEventDetailBlocks(workflowData, headCommit)
      ) as KnownBlock[],
      attachments: ([] as MessageAttachment[]).concat(
        ...getJobAttachments(jobsData),
        ...getSummaryAttachments(workflowData, pushBranchName, pullRequest)
      ) as MessageAttachment[],
    };

    let response;
    if (slackTimestamp) {
      const payload: ChatUpdateArguments = Object.assign({}, payloadBase, { ts: slackTimestamp });

      this.debug('Sending Slack [chat.update] payload');
      console.debug(JSON.stringify(payload, null, 2));

      response = await this.slackClient.chat.update(payload);
    } else {
      const payload: ChatPostMessageArguments = Object.assign({}, payloadBase, {
        username: slackBotUsername !== undefined && slackBotUsername.length > 0 ? slackBotUsername : undefined,
      });

      this.debug('Sending Slack [chat.postMessage] payload');
      console.debug(JSON.stringify(payload, null, 2));

      response = (await this.slackClient.chat.postMessage(payload)) as SlackChatPostMessageResponse;

      // Store the "ts" and "channel" for future updates. The channel gets is searchable in the initial postMessage
      // request but update requires the channel id which is returned in the response.
      this.sqsMessageBody.slackTimestamp = response.ts;
      // Update the channel with the proper non-aliased channel.
      this.sqsMessageBody.slackChannel = response.channel;
    }

    let error;
    if (response.error) {
      error = response.error;
      if (response.response_metadata && response.response_metadata.messages) {
        error += `: ${response.response_metadata.messages[0]}`;
      }
    }

    if (error != undefined) {
      throw new Error(`Unable to post message to Slack${error !== null ? ': ' + error : ''}\n`);
    }
  }

  async drain(signal: string): Promise<void> {
    this.log(`Active polling thread received ${signal}. Restoring message to queue`);
    this.running = false;

    await this.sqs
      .sendMessage({
        MessageBody: JSON.stringify(this.sqsMessageBody),
        QueueUrl: this.sqsQueueUrl,
      })
      .promise();

    this.log(`Successfully restored active workflow job in queue`);
  }
}

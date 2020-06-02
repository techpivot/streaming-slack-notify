import { Octokit } from '@octokit/rest';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient } from '@slack/web-api';
import { KnownBlock } from '@slack/types';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData } from '@octokit/types';
import { SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
import Debug from 'debug';
import {
  getFallbackText,
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getEventDetailBlocks,
  getJobAttachments,
} from './slack-ui';
import { GitHubWorkflowRunSummary, ChatResponse } from './interfaces';
import { SQSBody } from '../../common/lib/types';
import { getMemoryUsageMb, getReadableDurationString, sleep } from '../../common/lib/utils';

const debug = Debug('poller');

export default class Poller {
  startTime: Date;
  finished = false;

  // Time in ms between updates
  defaultIntervalTime = 1200;
  nextIntervalTime: number = this.defaultIntervalTime;

  // SQS
  sqs: SQS;
  queueUrl: string;
  messageBody: SQSBody;

  // Clients
  octokit?: Octokit;
  slack?: WebClient;

  constructor(sqs: SQS, queueUrl: string, message: SQS.Message) {
    const { Body } = message;
    if (!Body) {
      throw new Error('No message body for SQS payload');
    }

    this.startTime = new Date();
    this.sqs = sqs;
    this.queueUrl = queueUrl;
    this.messageBody = JSON.parse(Body);
  }

  async run(ee: EventEmitter): Promise<void> {
    const drain = (signal: string) => {
      this.drain(signal);
    };

    try {
      ee.on('drain', drain);

      this.log(`Starting GitHub actions workflow polling for Slack Team: ${this.messageBody.slack.teamName}`);
      this.log(`Current Node Memory Usage: ${getMemoryUsageMb()} MB`);

      let i = 0;
      while (this.finished !== true) {
        debug('Poll Loop #', ++i);
        const summary: GitHubWorkflowRunSummary = await this.queryGitHub();
        await this.updateSlack(summary);
        await sleep(this.nextIntervalTime);
        this.nextIntervalTime = this.defaultIntervalTime;
      }
      debug('GitHub workflow complete');
    } catch (err) {
      // This error could potentially be streamed back into the MESSAGE
      this.logError(err);
    } finally {
      ee.off('drain', drain);

      const slackTeamName = this.messageBody.slack.teamName;
      const duration = getReadableDurationString(this.startTime, new Date());

      this.log(`Completed GitHub actions workflow polling for Slack Team ${slackTeamName} in ${duration}`);
    }
  }

  log(message: string): void {
    console.log(this.messageBody.slack.teamId, message);
  }

  logError(message: string): void {
    console.error(this.messageBody.slack.teamId, message);
  }

  async drain(signal: string): Promise<void> {
    this.log(`Active polling thread received ${signal}. Restoring message to queue`);
    await this.sqs.sendMessage({
      MessageBody: JSON.stringify(this.messageBody),
      QueueUrl: this.queueUrl,
    });
    this.log(`Successfully restored active workflow job in queue`);
  }

  async queryGitHub(): Promise<GitHubWorkflowRunSummary> {
    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: '8c3208e3362e99b979e3901224dfa50d87829ad8', // this.messageBody.githubToken,
      });
    }

    const {
      runId,
      repository: { owner, repo },
    } = this.messageBody.github;
    const opts = {
      // Currently, GitHub likes this to be a number per there TypeScript definitions. I have a feeling
      // this will change in the future which is why we have this is a string.
      run_id: parseInt(runId, 10),
      owner,
      repo,
    };

    debug('Querying GitHub');

    const [workflow, jobs] = await Promise.all([
      this.octokit.actions.getWorkflowRun(opts),
      this.octokit.actions.listJobsForWorkflowRun(opts),
    ]);

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
    debug(`GitHub RateLimit: ${jobs.headers['x-ratelimit-limit']} req per hour`);
    debug(`GitHub Queries Remaining: ${Math.min(remaining1, remaining2)}`);

    return {
      ...this.messageBody.github,
      jobsData: jobs.data as ActionsListJobsForWorkflowRunResponseData,
      workflowData: workflow.data as ActionsGetWorkflowRunResponseData,
    };
  }

  async updateSlack(summary: GitHubWorkflowRunSummary): Promise<void> {
    const { accessToken, channel, ts, username, iconUrl, iconEmoji } = this.messageBody.slack;

    if (!this.slack) {
      this.slack = new WebClient(accessToken);
    }

    debug('Building Slack payload');

    // Build payload and send to Slack
    const payloadBase = {
      channel,
      text: getFallbackText(summary), // fallback when using blocks
      blocks: ([] as KnownBlock[]).concat(
        ...getTitleBlocks(summary),
        ...getEventSummaryBlocks(summary),
        getDividerBlock(),
        ...getEventDetailBlocks(summary),
        getDividerBlock()
      ) as KnownBlock[],
      attachments: getJobAttachments(summary),
    };

    debug('Sending Slack payload');

    let response;
    if (ts) {
      const payload: ChatUpdateArguments = Object.assign({}, payloadBase, { ts });
      debug('Slack: update');

      response = (await this.slack.chat.update(payload)) as ChatResponse;
    } else {
      const payload: ChatPostMessageArguments = Object.assign({}, payloadBase, {
        username,
        icon_url: iconUrl,
        icon_emoji: iconEmoji,
      });

      debug('Slack: postMessage');

      response = (await this.slack.chat.postMessage(payload)) as ChatResponse;

      // Store the "ts" and "channel" for future updates. The channel gets is searchable in the initial postMessage
      // request but update requires the channel id which is returned in the response.
      this.messageBody.slack.ts = response.ts;
      this.messageBody.slack.channel = response.channel;
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

    // If the last job was successful, it takes about 200ms to mark workflow complete. So instead of waiting
    // 1 to 2 seconds, decrease the interval time.
    const lastJob = summary.jobsData.jobs[summary.jobsData.jobs.length];
    if (lastJob !== undefined && lastJob.status === 'completed') {
      debug('Decreasing interval time to 250ms');
      this.nextIntervalTime = 250;
    }

    if (summary.workflowData.status === 'completed') {
      this.finished = true;
    }
  }
}

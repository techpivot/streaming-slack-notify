import { Octokit } from '@octokit/rest';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient, WebAPICallResult } from '@slack/web-api';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData } from '@octokit/types';
import { SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
import Debug from 'debug';
import { GitHubWorkflowComplete } from './errors';
import {
  getFallbackText,
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getEventDetailBlocks,
  getJobAttachments,
} from './slack-ui';
import { GitHubWorkflowRunSummary } from './interfaces';
import { SQSBody } from '../../common/lib/interfaces';
import { getMemoryUsageMb, getReadableElapsedTime, sleep } from '../../common/lib/utils';

const debug = Debug('poller');

export default class Poller {
  startTime: Date;

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

    // Validate Body
    const messageBody = JSON.parse(Body);

    this.startTime = new Date();
    this.sqs = sqs;
    this.queueUrl = queueUrl;
    this.messageBody = messageBody;
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
      while (true) {
        debug('Poll Loop #', ++i);
        const summary: GitHubWorkflowRunSummary = await this.queryGitHub();
        await this.updateSlack(summary);
        sleep(2500);
      }
    } catch (err) {
      if (err instanceof GitHubWorkflowComplete) {
        debug('GitHub workflow complete');
      } else {
        // This error could potentially be streamed back into the MESSAGE
        this.logError(err);
      }
    } finally {
      ee.off('drain', drain);

      const slackTeamName = this.messageBody.slack.teamName;
      const duration = getReadableElapsedTime(this.startTime, new Date());

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
        auth: 'dcf631b9c0d5274a26d6779843afcfe1306966d7',
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
    // workflow.headers
    //      "x-ratelimit-limit": "5000",
    //      "x-ratelimit-remaining": "4995",
    //      "x-ratelimit-reset": "1590444834",

    return {
      ...this.messageBody.github,
      jobsData: jobs.data as ActionsListJobsForWorkflowRunResponseData,
      workflowData: workflow.data as ActionsGetWorkflowRunResponseData,
    };
  }

  async updateSlack(summary: GitHubWorkflowRunSummary): Promise<void> {
    if (!this.slack) {
      this.slack = new WebClient(this.messageBody.slack.accessToken);
    }

    debug('Building Slack payload');

    // Build payload and send to Slack
    const payloadBase = {
      channel: '#builds', //channel,
      text: getFallbackText(summary), // fallback when using blocks
      blocks: [].concat.apply([], [
        getTitleBlocks(summary),
        getEventSummaryBlocks(summary),
        getDividerBlock(),
        getEventDetailBlocks(summary),
        getDividerBlock(),
      ] as Array<any>),
      attachments: getJobAttachments(summary),
    };

    debug('Sending Slack payload');

    if (summary.workflowData.status === 'completed') {
      throw new GitHubWorkflowComplete();
    }
  }
}

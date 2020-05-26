import { Octokit } from '@octokit/rest';
import { ChatPostMessageArguments, ChatUpdateArguments, WebClient, WebAPICallResult } from '@slack/web-api';
import { ActionsGetWorkflowRunResponseData, ActionsListJobsForWorkflowRunResponseData } from '@octokit/types';
import { DynamoDB, SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
import Debug from 'debug';
import { DB_NAME, REGION } from './const';
import { GitHubWorkflowComplete } from './errors';
import {
  getFallbackText,
  getTitleBlocks,
  getDividerBlock,
  getEventSummaryBlocks,
  getEventDetailBlocks,
  getJobAttachments,
} from './slack-ui';
import { getMemoryUsageMb, getReadableElapsedTime, sleep } from './utils';
import { GitHubWorkflowSummary } from './types';
const debug = Debug('poller');

type SQSBody = {
  tokenId: string;
};

export default class Poller {
  startTime: Date;
  sqs: SQS;
  queueUrl: string;
  dynamoDbClient: DynamoDB.DocumentClient;
  tokenId: string;
  messageBody: string;
  slackAccessToken?: string;
  teamName?: string;
  teamId?: string;
  slackMessageTimestamp?: string;
  octokit?: Octokit;
  slack?: WebClient;

  constructor(sqs: SQS, queueUrl: string, message: SQS.Message) {
    const { Body } = message;
    if (!Body) {
      throw new Error('No message body for SQS payload');
    }

    const { tokenId }: SQSBody = JSON.parse(Body);
    if (!tokenId) {
      throw new Error('No "tokenId" parameter specified');
    }

    this.startTime = new Date();
    this.sqs = sqs;
    this.queueUrl = queueUrl;
    this.messageBody = Body;
    this.tokenId = tokenId;
    this.dynamoDbClient = new DynamoDB.DocumentClient({ region: REGION });
  }

  async run(ee: EventEmitter): Promise<void> {
    const drain = (signal: string) => {
      this.drain(signal);
    };

    try {
      ee.on('drain', drain);
      await this.initializeRecordData();
      console.log(this.teamId, `Starting GitHub actions workflow polling for Slack Team: ${this.teamName}`);
      console.log(this.teamId, `Current Node Memory Usage: ${getMemoryUsageMb()} MB`);

      let i = 0;
      while (true) {
        debug('Poll Loop #', ++i);
        const { workflowData, jobsData }: GitHubWorkflowSummary = await this.queryGitHub();
        await this.updateSlack(workflowData, jobsData);
        sleep(2500);
      }

    } catch (err) {
      if (err instanceof GitHubWorkflowComplete) {
        debug('GitHub workflow complete');
      } else {
        // This error could potentially be streamed back into the MESSAGE
        console.error(this.teamId, err);
      }
    } finally {
      ee.off('drain', drain);
      console.log(
        this.teamId,
        `Completed GitHub actions workflow polling for Slack Team ${this.teamName} in`,
        getReadableElapsedTime(this.startTime, new Date())
      );
    }
  }

  async drain(signal: string): Promise<void> {
    console.log(this.teamId, `Active polling thread received ${signal}. Restoring message to queue`);
    const result = await this.sqs.sendMessage(
      {
        MessageBody: this.messageBody,
        QueueUrl: this.queueUrl,
      },
      () => {
        console.log(arguments);
      }
    );
    console.log(this.teamId, `Successfully restored active workflow job in queue`);
  }

  async initializeRecordData(): Promise<void> {
    if (this.slackAccessToken && this.teamName && this.teamId) {
      return;
    }

    const result = await this.dynamoDbClient
      .get({
        TableName: DB_NAME,
        Key: { id: this.tokenId },
        ProjectionExpression: 'id, access_token, team_name, team_id',
      })
      .promise();
    if (!result.Item) {
      throw new Error(`Unable to retrieve database record for token id: ${this.tokenId}:`);
    }

    this.slackAccessToken = result.Item['access_token'];
    this.teamName = result.Item['team_name'];
    this.teamId = result.Item['team_id'];

    // Update the workflow count
    await this.dynamoDbClient
      .update({
        TableName: DB_NAME,
        Key: { id: this.tokenId },
        UpdateExpression: 'set workflow_run_count = workflow_run_count + :val',
        ExpressionAttributeValues: { ':val': 1 },
      })
      .promise();
  }

  async queryGitHub(): Promise<GitHubWorkflowSummary> {
    debug('Querying GitHub');
    if (!this.octokit) {
      this.octokit = new Octokit({
        auth: 'dcf631b9c0d5274a26d6779843afcfe1306966d7',
      });
    }

    const opts = {
      run_id: 113438925,
      owner: 'techpivot',
      repo: 'streaming-slack-notify',
    };
    const [workflow, jobs] = await Promise.all([
      this.octokit.actions.getWorkflowRun(opts),
      this.octokit.actions.listJobsForWorkflowRun(opts),
    ]);

    const jobsData = jobs.data as ActionsListJobsForWorkflowRunResponseData;
    const workflowData = workflow.data as ActionsGetWorkflowRunResponseData;

    // Build payload and send to Slack
    const payloadBase = {
      channel: '#builds', //channel,
      text: getFallbackText(workflowData), // fallback when using blocks
      blocks: [].concat.apply([], [
        getTitleBlocks(workflowData),
        getEventSummaryBlocks(),
        getDividerBlock(),
        getEventDetailBlocks(),
        getDividerBlock(),
      ] as Array<any>),
      attachments: getJobAttachments(jobsData),
    };

    // Check Rate Limits
    // workflow.headers
    // poller     "x-ratelimit-limit": "5000",
    // poller     "x-ratelimit-remaining": "4995",
    // poller     "x-ratelimit-reset": "1590444834",

    //debug(JSON.stringify(workflow, null, 2));
    //debug(JSON.stringify(jobs, null, 2));



    return {
      workflowData,
      jobsData,
    };
  }

  async updateSlack(workflowData: ActionsGetWorkflowRunResponseData, jobsData: ActionsListJobsForWorkflowRunResponseData): Promise<void> {
    debug('Posting to Slack');
    if (!this.slack) {
      this.slack = new WebClient(this.slackAccessToken);
    }

    if (workflowData.status === 'completed') {
      throw new GitHubWorkflowComplete();
    }
  }
}

// { "tokenId": "143cba0f-e40c-4bd2-a8a9-33f190e0c300" }

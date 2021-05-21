import { S3, SQS, ECSCredentials, config } from 'aws-sdk';
import Debug from 'debug';
import { EventEmitter } from 'events';
import * as https from 'https';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import { Consumer } from './sqs-consumer';
import Poller from './github-poller';
import { REGION } from '../../common/lib/const';
import {
  getSqsQueueUrl,
  getGitHubAppClientSecret,
  getGitHubAppPrivateKey,
  getFaunadbServerSecret,
} from '../../common/lib/ssm';
import { SQSBody, SQSBodyV } from '../../common/lib/types';

const debug = Debug('server');
const globalEmitter = new EventEmitter({ captureRejections: true });

async function run(): Promise<void> {
  let queueUrl: string;
  let githubAppClientSecret: string;
  let githubAppPrivateKey: string;
  let faunadbServerSecret: string;

  debug(`Setting global AWS SDK region to: ${REGION}`);
  config.update({ region: REGION });

  if (process.env.AWS_EXECUTION_ENV === 'AWS_ECS_EC2') {
    debug('Using ECSCredentials for AWS SDK');
    const credentials = new ECSCredentials();
    await credentials.getPromise();
    config.credentials = credentials;
  }

  const sqs = new SQS({
    httpOptions: {
      timeout: 25000,
      connectTimeout: 5000,
      agent: new https.Agent({
        keepAlive: true,
      }),
    },
  });

  try {
    debug('Retrieving SQS queue URL ...');
    queueUrl = await getSqsQueueUrl();
    debug('✓ SQS URL:', queueUrl);
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve queue URL');
    console.error(err);
    process.exit(1);
  }

  try {
    debug('Retrieving GitHub app client secret ...');
    githubAppClientSecret = await getGitHubAppClientSecret();
    debug('✓ Successfully retrieved GitHub app client secret');
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve GitHub app client secret');
    console.error(err);
    process.exit(1);
  }

  try {
    debug('Retrieving GitHub app private key ...');
    githubAppPrivateKey = await getGitHubAppPrivateKey();
    debug('✓ Successfully retrieved GitHub app private key');
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve GitHub app private key');
    console.error(err);
    process.exit(1);
  }

  try {
    debug('Retrieving Faunadb server secret ...');
    faunadbServerSecret = await getFaunadbServerSecret();
    debug('✓ Successfully retrieved Faunadb server secret');
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve Faunadb server secret');
    console.error(err);
    process.exit(1);
  }

  debug('Starting SQS consumer to long poll for messages ...');

  const consumer = new Consumer({
    queueUrl,
    batchSize: 10,
    waitTimeSeconds: 20,
    visibilityTimeout: 20,
    authenticationErrorTimeout: 10000,
    pollingWaitTimeMs: 0,
    sqs,
    handleMessage: async (message: SQS.Message) => {
      // Validate the message
      const { Body } = message;
      try {
        if (!Body) {
          throw new Error('No message body for SQS payload');
        }

        const body = JSON.parse(Body);
        const result = SQSBodyV.decode(body);

        if (isLeft(result)) {
          throw new Error(PathReporter.report(result).join('\n'));
        }

        debug('Received valid SQS message. Starting new GitHub poller ...');
        const poller = new Poller(
          githubAppClientSecret,
          githubAppPrivateKey,
          faunadbServerSecret,
          sqs,
          queueUrl,
          body as SQSBody
        );

        // This is async. Intentionally, we do not wait 'await'. We want to run this
        // async in another thread. Additionally, we pass in the global event emitter
        // to bind a "drain" event in the event we receive a SIGTERM from ECS host instance.
        poller.run(globalEmitter);

        // Upon returning immediately, the message is then immediately deleted by the Consumer.
      } catch (err) {
        debug(`[ERROR] ${err}`);
      }
    },
  });

  // SQS Errors

  // Timeout Error. Currently not specifying a timeout so we won't have any of these
  // app.on('timeout_error', (err) => {});

  // We handle uncaught processing errors here. In general, since we're explicitly wrapping our Poller.run()
  // in a try/catch, this yields really only constructor() errors.
  consumer.on('processing_error', (err, message: SQS.Message) => {
    console.error('Unable to process message: ', err.message);

    // Since the message wasn't processed, it never gets deleted. Delete manually.
    const { MessageId, ReceiptHandle } = message;
    if (ReceiptHandle !== undefined) {
      debug('Manually deleting: ', MessageId, ReceiptHandle);
      const params = {
        QueueUrl: queueUrl,
        ReceiptHandle,
      };
      sqs.deleteMessage(params, () => {
        debug('Successfully deleted: ', MessageId, ReceiptHandle);
      });
    }
  });

  // Register signal handlers
  // Note: ECS host sends the SIGTERM signal to the docker container when ECS agent uses
  // "ECS_ENABLE_SPOT_INSTANCE_DRAINING" set to true.
  // Ref: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-spot.html
  ['SIGINT', 'SIGTERM'].forEach((signal) => {
    process.on(signal, async () => {
      debug(`Received ${signal} signal. Stopping any active pollers and restoring active payloads to queue`);
      consumer.stop();
      globalEmitter.emit('drain', signal);
    });
  });

  process.on('beforeExit', async () => {
    debug('Exiting');
  });

  consumer.start();
}

run();

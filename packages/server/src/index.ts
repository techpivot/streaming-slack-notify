import { SQS } from 'aws-sdk';
import { EventEmitter } from 'events';
import * as https from 'https';
import { PathReporter } from 'io-ts/lib/PathReporter';
import { isLeft } from 'fp-ts/lib/Either';
import { Consumer } from './consumer';
import Poller from './poller.ts.orig';
import { REGION } from '../../common/lib/const';
import { getSqsQueueUrl, getGitHubAppPrivateKey } from '../../common/lib/ssm';
import { SQSBody, SQSBodyV } from '../../common/lib/types';
import { debug } from '@actions/core';

const globalEmitter = new EventEmitter({ captureRejections: true });

const sqs = new SQS({
  region: REGION,
  httpOptions: {
    timeout: 25000,
    connectTimeout: 5000,
    agent: new https.Agent({
      keepAlive: true,
    }),
  },
});

async function run(): Promise<void> {
  let queueUrl: string;
  let githubAppPrivateKey: string;

  try {
    console.log('Retrieving SQS queue URL ...');
    queueUrl = await getSqsQueueUrl();
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to retrieve queue URL');
    console.error(err);
    process.exit(1);
  }

  try {
    console.log('Retrieving GitHub app client secret ...');
    githubAppPrivateKey = await getGitHubAppPrivateKey();
  } catch (err) {
    console.error('Error: Unable to connect to AWS Parameter Store to GitHub app client secret');
    console.error(err);
    process.exit(1);
  }

  const app = Consumer.create({
    queueUrl,
    batchSize: 10,
    waitTimeSeconds: 20,
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

        console.log('create');

        const poller = new Poller(sqs, queueUrl, body as SQSBody);

        // This is async. Intentionally, we do not wait 'await'. We want to run this
        // async in another thread. Additionally, we pass in the global event emitter
        // to bind a "drain" event in the event we receive a SIGTERM from ECS host instance.
        //poller.run(globalEmitter);

        // Upon returning immediately, the message is then immediately deleted by the Consumer.
      } catch (err) {
        debug('here');
        console.error('Received an invalid SQSBody payload. Ignoring', Body);
      }
    },
  });

  // SQS Errors
  app.on('error', (err) => {
    // @todo Fixme
    // potentially handle deletes here
    console.error('1 sqs error', err.message);
  });

  // Timeout Error. Currently not specifying a timeout so we won't have any of these
  // app.on('timeout_error', (err) => {});

  // We handle uncaught processing errors here. In general, since we're explicitly wrapping our Poller.run()
  // in a try/catch, this yields really only constructor() errors.
  app.on('processing_error', (err, message: SQS.Message) => {
    console.error('Unable to process message: ', err.message);

    // Since the message wasn't processed, it never gets deleted. Delete manually.
    const { MessageId, ReceiptHandle } = message;
    if (ReceiptHandle !== undefined) {
      console.log('Manually deleting: ', MessageId, ReceiptHandle);
      const params = {
        QueueUrl: queueUrl,
        ReceiptHandle: ReceiptHandle,
      };
      sqs.deleteMessage(params, () => {
        console.log('Successfully deleted: ', MessageId, ReceiptHandle);
      });
    }
  });

  const drainActivePollers = async (signal: string) => {
    console.log(`Received ${signal} signal. Stopping any active pollers and restoring payloads to queue`);
    app.stop();

    // Await doesn't work here; however, keeping it for consistency.
    await globalEmitter.emit('drain', signal);

    // Kill the process after the 'drain' events have finished restoring messages. Typically these complete
    // in a few 100ms.
    setTimeout(() => {
      console.log('Exiting');
      process.exit();
    }, 2000);
  };

  // Register signal handlers

  // ECS host sends the SIGTERM signal to the docker container
  process.on('SIGTERM', () => drainActivePollers('SIGTERM'));

  app.start();
}

run();

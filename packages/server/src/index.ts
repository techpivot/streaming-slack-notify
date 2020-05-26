import { SQS } from 'aws-sdk';
import { Consumer } from './consumer';
import { EventEmitter } from 'events';
import https from 'https';
import { REGION } from './const';
import Poller from './poller';
import { getSqsQueueUrl } from './utils';

let queueUrl: string;
let globalEmitter = new EventEmitter({ captureRejections: true });

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
  queueUrl = await getSqsQueueUrl();

  const app = Consumer.create({
    queueUrl,
    batchSize: 10,
    waitTimeSeconds: 20,
    //visibilityTimeout:
    authenticationErrorTimeout: 10000,
    pollingWaitTimeMs: 0,
    sqs,
    handleMessage: async (message: SQS.Message) => {
      const poller = new Poller(sqs, queueUrl, message);

      // This is async. Intentionally, we do not wait 'await'. We want to run this
      // async in another thread. Additionally, we pass in the global event emitter
      // to bind a "drain" event in the event we receive a SIGTERM from ECS host instance.
      poller.run(globalEmitter);

      // Upon returning immediately, the message is deleted by the Consumer.
    },
  });

  app.on('response_processed', () => {
    console.log('processed');
  });

  // SQS Errors
  app.on('error', (err) => {
    // potentially handle deletes here
    console.error('1 sqs error', err.message);
  });

  // Timeout Error
  app.on('timeout_error', (err) => {
    console.error('2 timeout', err.message);
  });

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
  process.on('SIGINT', () => drainActivePollers('SIGINT'));
  process.on('SIGTERM', () => drainActivePollers('SIGTERM'));

  app.start();
}

run();

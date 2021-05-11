import { AWSError } from 'aws-sdk';
import { SQSError, TimeoutError } from './errors';
import { TimeoutResponse } from './interfaces';

export const isConnectionError = (err: Error): boolean => {
  if (err instanceof SQSError) {
    return err.statusCode === 403 || err.code === 'CredentialsError' || err.code === 'UnknownEndpoint';
  }

  return false;
};

export const toSQSError = (err: AWSError, message: string): SQSError => {
  const sqsError = new SQSError(message);
  sqsError.code = err.code;
  sqsError.statusCode = err.statusCode;
  sqsError.region = err.region;
  sqsError.retryable = err.retryable;
  sqsError.hostname = err.hostname;
  sqsError.time = err.time;

  return sqsError;
};

export const createTimeout = (durationMs: number): TimeoutResponse => {
  let timeoutHandle;

  const promise = new Promise<void>((_, reject) => {
    timeoutHandle = setTimeout((): void => {
      reject(new TimeoutError());
    }, durationMs);
  });

  return {
    timeoutHandle,
    promise,
  };
};

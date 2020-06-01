export class SQSError extends Error {
  code?: string;
  statusCode?: number;
  region?: string;
  hostname?: string;
  time?: Date;
  retryable?: boolean;

  constructor(message: string) {
    super(message);
    this.name = this.constructor.name;
  }
}

export class TimeoutError extends Error {
  constructor(message = 'Operation timed out.') {
    super(message);
    this.message = message;
    this.name = 'TimeoutError';
  }
}

export class GitHubWorkflowComplete extends Error {}

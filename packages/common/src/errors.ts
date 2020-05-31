export class BaseError extends Error {
  name: string;
  statusCode: number;

  constructor(message: string, name: string, statusCode: number) {
    super(message);
    this.name = name;
    this.statusCode = statusCode;
  }

  public getStatusCode(): number {
    return this.statusCode;
  }
}

export class InvalidJsonError extends BaseError {
  constructor(message: string) {
    super(message, 'InvalidJsonError', 400);
  }
}

export class ValidationError extends BaseError {
  constructor(message: string) {
    super(message, 'ValidationError', 400);
  }
}

export class NotFoundError extends BaseError {
  constructor(message: string) {
    super(message, 'NotFoundError', 400);
  }
}

export class SlackAuthError extends BaseError {
  constructor(message: string, name: string) {
    super(message, name, 400);
  }
}

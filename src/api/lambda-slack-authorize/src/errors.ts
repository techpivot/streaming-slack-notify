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

export class BadRequest extends BaseError {
  constructor(message: string) {
    super(message, 'BadRequest', 400);
  }
}

export class SlackAuthError extends BaseError {
  constructor(message: string, name: string) {
    super(message, name, 400);
  }
}

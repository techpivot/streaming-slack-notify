import { WebAPICallResult } from '@slack/web-api';

export type EventRequestContext = {
  accountId: string;
  apiId: string;
  domainName: string;
  domainPrefix: string;
  http: {
    method: string;
    path: string;
    protocol: string;
    sourceIp: string;
    userAgent: string;
  };
  requestId: string;
  routeKey: string;
  stage: string;
  time: string;
  timeEpoch: number;
};

export type Event = {
  version: string;
  routeKey: string;
  rawPath: string;
  rawQueryString: string;
  headers: object;
  queryStringParameters: {
    code?: string;
  };
  requestContext: EventRequestContext;
  isBase64Encoded: boolean;
};

export type Context = {
  invokedFunctionArn?: string;
};

export type SlackSecrets = {
  client_id: string;
  client_secret: string;
  signing_secret: string;
};

export interface OauthV2AccessResponse extends WebAPICallResult {
  /*
  ok: boolean;
  error?: string;
  response_metadata?: {
      warnings?: string[];
      next_cursor?: string;
      scopes?: string[];
      acceptedScopes?: string[];
      retryAfter?: number;
      messages?: string[];
  };
  [key: string]: unknown;
  */
  app_id: string;
  authed_user: {
    id: string;
  };
  scope: string;
  token_type: 'bot';
  access_token: string;
  bot_user_id: string;
  team: {
    id: string;
    name: string;
  };
  enterprise?: {
    id: string;
    name: string;
  };
}

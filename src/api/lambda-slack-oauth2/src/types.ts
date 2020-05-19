export type EventRequestContext = {
  accountId: string,
  apiId: string,
  domainName: string,
  domainPrefix: string,
  http: {
    method: string,
    path: string,
    protocol: string,
    sourceIp: string,
    userAgent: string,
  },
  requestId: string,
  routeKey: string,
  stage: string,
  time: string,
  timeEpoch: number
};

export type Event = {
  version: string,
  routeKey: string,
  rawPath: string,
  rawQueryString: string,
  headers: object,
  queryStringParameters: object,
  requestContext: EventRequestContext,
  isBase64Encoded: boolean
}

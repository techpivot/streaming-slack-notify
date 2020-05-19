{
  "requestId": "$context.requestId",
  "ip": "$context.identity.sourceIp",
  "requestTime": "$context.requestTime",
  "httpMethod": "$context.httpMethod",
  "protocol": "$context.protocol",
  "routeKey": "$context.routeKey",
  "lambdaStatus": $context.integrationStatus,
  "lambdaTime": $context.integrationLatency,
  "responseStatus": $context.status,
  "responseError": "$context.error.message",
  "responseTime": $context.responseLatency,
  "responseLength": $context.responseLength
}
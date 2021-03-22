locals {
  lambda_slack_webhook_file          = "${path.module}/../packages/api-lambda-slack-webhook/dist/api-lambda-slack-webhook.zip"
  lambda_slack_webhook_function_name = module.lambda_slack_webhook_label.id
}

module "lambda_slack_webhook_label" {
  source    = "cloudposse/label/null"
  version   = "0.24.1"
  namespace = var.namespace
  name      = "slack-webhook"
  tags      = local.tags
}

resource "aws_lambda_function" "lambda_slack_webhook" {
  filename         = local.lambda_slack_webhook_file
  source_code_hash = filebase64sha256(local.lambda_slack_webhook_file)
  function_name    = module.lambda_slack_webhook_label.id
  description      = "Handles requests from the Slack Events API."
  role             = module.iam_lambda_slack_webhook.arn
  handler          = "index.handler"
  memory_size      = 192
  timeout          = var.lambda_slack_webhook_timeout
  runtime          = "nodejs14.x"
  tags             = module.lambda_slack_webhook_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_slack_webhook" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_slack_webhook.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*/slack/webhook"
}

resource "aws_lambda_function_event_invoke_config" "lambda_slack_webhook_invoke_config" {
  function_name                = aws_lambda_function.lambda_slack_webhook.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}

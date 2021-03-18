module "lambda_slack_authorize_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["slack-authorize"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

locals {
  lambda_slack_authorize_file          = "${path.module}/../packages/api-lambda-slack-authorize/dist/api-lambda-slack-authorize.zip"
  lambda_slack_authorize_function_name = module.lambda_slack_authorize_label.id
}

resource "aws_lambda_function" "lambda_slack_authorize" {
  filename         = local.lambda_slack_authorize_file
  source_code_hash = filebase64sha256(local.lambda_slack_authorize_file)
  function_name    = module.lambda_slack_authorize_label.id
  description      = "Handles the payload from Slack OAuth2 application requests and responds with appropriate success/error templates."
  role             = aws_iam_role.lambda_slack_authorize_role.arn
  handler          = "index.handler"
  memory_size      = 128
  timeout          = var.lambda_slack_oauth_authorize_timeout
  runtime          = "nodejs12.x"
  tags             = module.lambda_slack_authorize_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_slack_authorize" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_slack_authorize.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*/slack/authorize"
}

resource "aws_lambda_function_event_invoke_config" "lambda_slack_authorize_invoke_config" {
  function_name                = aws_lambda_function.lambda_slack_authorize.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}
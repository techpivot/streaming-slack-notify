module "lambda_github_app_webhook_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["github-app-webhook"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

locals {
  lambda_github_app_webhook_file          = "${path.module}/../packages/api-lambda-github-app-webhook/dist/api-lambda-github-app-webhook.zip"
  lambda_github_app_webhook_function_name = module.lambda_github_app_webhook_label.id
}

resource "aws_lambda_function" "lambda_github_app_webhook" {
  filename         = local.lambda_github_app_webhook_file
  source_code_hash = filebase64sha256(local.lambda_github_app_webhook_file)
  function_name    = module.lambda_github_app_webhook_label.id
  description      = "Handles the payload from GitHub for webhooks associated with the GitHub app."
  role             = aws_iam_role.lambda_github_app_webhook_role.arn
  handler          = "index.handler"
  memory_size      = 128
  timeout          = var.lambda_slack_oauth_authorize_timeout
  runtime          = "nodejs12.x"
  tags             = module.lambda_github_app_webhook_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_github_app_webhook" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_github_app_webhook.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*/github/webhook"
}

resource "aws_lambda_function_event_invoke_config" "lambda_github_app_webhook_invoke_config" {
  function_name                = aws_lambda_function.lambda_github_app_webhook.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}
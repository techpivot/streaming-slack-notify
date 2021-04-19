locals {
  lambda_github_webhook_file          = "${path.module}/../packages/api-lambda-github-webhook/dist/api-lambda-github-webhook.zip"
  lambda_github_webhook_function_name = module.lambda_github_webhook_label.id
}

module "lambda_github_webhook_label" {
  source    = "cloudposse/label/null"
  version   = "0.24.1"
  namespace = var.namespace
  name      = "github-webhook"
  tags      = local.tags
}

resource "aws_lambda_function" "lambda_github_webhook" {
  filename         = local.lambda_github_webhook_file
  source_code_hash = filebase64sha256(local.lambda_github_webhook_file)
  function_name    = module.lambda_github_webhook_label.id
  description      = "Handles requests from the GitHub Events API."
  role             = module.iam_lambda_github_webhook.arn
  handler          = "index.handler"
  memory_size      = 192
  timeout          = var.lambda_github_webhook_timeout
  runtime          = var.lambda_runtime

  # This prevents one extra query
  environment {
    variables = {
      queue_url = aws_sqs_queue.default.id
    }
  }

  tags = module.lambda_github_webhook_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_github_webhook" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_github_webhook.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*${split(" ", aws_apigatewayv2_route.route_get_github_webhook.route_key)[1]}"
}

resource "aws_lambda_function_event_invoke_config" "lambda_github_webhook_invoke_config" {
  function_name                = aws_lambda_function.lambda_github_webhook.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}

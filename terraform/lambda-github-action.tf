module "lambda_github_action_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["github-action"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

locals {
  lambda_github_action_file          = "${path.module}/../packages/api-lambda-github-action/dist/api-lambda-github-action.zip"
  lambda_github_action_function_name = module.lambda_github_action_label.id
}

resource "aws_lambda_function" "lambda_github_action" {
  filename         = local.lambda_github_action_file
  source_code_hash = filebase64sha256(local.lambda_github_action_file)
  function_name    = module.lambda_github_action_label.id
  description      = "Handles requests from GitHub action workflows to start streaming by validating payload and then adding into SQS."
  role             = aws_iam_role.lambda_github_action_role.arn
  handler          = "index.handler"
  memory_size      = 128
  timeout          = var.lambda_slack_oauth_authorize_timeout
  runtime          = "nodejs12.x"
  environment {
    variables = {
      queue_url = aws_sqs_queue.default.id
    }
  }
  tags = module.lambda_github_action_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_github_action" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_github_action.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*/"
}

resource "aws_lambda_function_event_invoke_config" "lambda_github_action_invoke_config" {
  function_name                = aws_lambda_function.lambda_github_action.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}
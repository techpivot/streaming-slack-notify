locals {
  lambda_github_post_install_file          = "${path.module}/../packages/api-lambda-github-post-install/dist/api-lambda-github-post-install.zip"
  lambda_github_post_install_function_name = module.lambda_github_post_install_label.id
}

module "lambda_github_post_install_label" {
  source    = "cloudposse/label/null"
  version   = "0.24.1"
  namespace = var.namespace
  name      = "github-post-install"
  tags      = local.tags
}

resource "aws_lambda_function" "lambda_github_post_install" {
  filename         = local.lambda_github_post_install_file
  source_code_hash = filebase64sha256(local.lambda_github_post_install_file)
  function_name    = module.lambda_github_post_install_label.id
  description      = "Handles requests from just after GitHub app installation takes place and serves the default install configuration page."
  role             = module.iam_lambda_github_post_install.arn
  handler          = "index.handler"
  memory_size      = 192
  timeout          = var.lambda_github_post_install_timeout
  runtime          = var.lambda_runtime
  tags             = module.lambda_github_post_install_label.tags
}

resource "aws_lambda_permission" "allow_api_gateway_invoke_lambda_github_post_install" {
  statement_id  = "AllowExecutionFromApiGateway"
  function_name = aws_lambda_function.lambda_github_post_install.function_name
  action        = "lambda:InvokeFunction"
  principal     = "apigateway.amazonaws.com"
  source_arn    = "${aws_apigatewayv2_api.default.execution_arn}/*/*${split(" ", aws_apigatewayv2_route.route_get_github_post_install_get.route_key)[1]}"
}

resource "aws_lambda_function_event_invoke_config" "lambda_github_post_install_invoke_config" {
  function_name                = aws_lambda_function.lambda_github_post_install.function_name
  maximum_event_age_in_seconds = 60
  maximum_retry_attempts       = 0
}

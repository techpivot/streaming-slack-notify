module "cloudwatch_lambda_github_webhook_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["lambda", "github-webhook", "logs"]
  tags       = local.tags
}

resource "aws_cloudwatch_log_group" "log_group_lambda_github_webhook" {
  name              = "/aws/lambda/${local.lambda_github_webhook_function_name}"
  retention_in_days = 14
  tags              = module.cloudwatch_lambda_github_webhook_label.tags
}

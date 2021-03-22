module "cloudwatch_lambda_slack_authorize_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["lambda", "slack-authorize", "logs"]
  tags       = local.tags
}

resource "aws_cloudwatch_log_group" "log_group_lambda_slack_authorize" {
  name              = "/aws/lambda/${local.lambda_slack_authorize_function_name}"
  retention_in_days = 14
  tags              = module.cloudwatch_lambda_slack_authorize_label.tags
}

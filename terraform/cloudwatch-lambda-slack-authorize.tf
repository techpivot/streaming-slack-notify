module "cloudwatch_lambda_slack_authorize_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["lambda", "slack-authorize", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "log_group_lambda_slack_authorize" {
  name              = "/aws/lambda/${local.lambda_slack_authorize_function_name}"
  retention_in_days = 30
  tags              = module.cloudwatch_lambda_slack_authorize_label.tags
}

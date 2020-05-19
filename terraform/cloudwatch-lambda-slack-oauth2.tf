module "cloudwatch_lambda_slack_oauth2" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["lambda", "slack-oauth2", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "log_group_slack_oauth2" {
  name              = "/aws/lambda/${module.lambda_slack_oath2_label.id}"
  retention_in_days = 30
  tags              = module.cloudwatch_lambda_slack_oauth2.tags
}

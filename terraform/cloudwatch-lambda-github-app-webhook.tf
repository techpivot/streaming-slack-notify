module "cloudwatch_lambda_github_app_webhook_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["lambda", "github-app-webhook", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "log_group_lambda_github_app_webhook" {
  name              = "/aws/lambda/${local.lambda_github_app_webhook_function_name}"
  retention_in_days = 30
  tags              = module.cloudwatch_lambda_github_app_webhook_label.tags
}

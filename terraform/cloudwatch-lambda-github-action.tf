module "cloudwatch_lambda_github_action_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["lambda", "github-action", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "log_group_lambda_github_action" {
  name              = "/aws/lambda/${local.lambda_github_action_function_name}"
  retention_in_days = 30
  tags              = module.cloudwatch_lambda_github_action_label.tags
}

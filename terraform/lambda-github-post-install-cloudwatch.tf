module "cloudwatch_lambda_github_post_install_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["lambda", "github-post_install", "logs"]
  tags       = local.tags
}

resource "aws_cloudwatch_log_group" "log_group_lambda_github_post_install" {
  name              = "/aws/lambda/${local.lambda_github_post_install_function_name}"
  retention_in_days = 14
  tags              = module.cloudwatch_lambda_github_post_install_label.tags
}

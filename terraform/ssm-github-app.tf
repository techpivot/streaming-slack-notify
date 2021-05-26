# Note: For all values, we stub out the actual parameter with a dummy value as this is updated just once
# manually post-apply.

module "ssm_parameter_github_app_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "github-app", "client-secret"]
  tags       = local.tags
}

resource "aws_ssm_parameter" "github_app_client_secret" {
  name        = "${local.ssm_github_prefix}/client-secret"
  description = "GitHub application client secret."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_github_app_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "github_app_private_key" {
  name        = "${local.ssm_github_prefix}/private-key"
  description = "GitHub application private key."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_github_app_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

resource "aws_ssm_parameter" "github_app_webhook_secret" {
  name        = "${local.ssm_github_prefix}/webhook-secret"
  description = "GitHub application webhook secret."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_github_app_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

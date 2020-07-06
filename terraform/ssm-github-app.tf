module "ssm_parameter_github_app_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ssm", "github-app", "private-key"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

#
# We stub out the actual parameter with a dummy value such that we can potentially reference
# paths from a consistent location.
#
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

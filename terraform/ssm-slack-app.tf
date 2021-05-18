module "ssm_parameter_client_id_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "slack", "client-id"]
  tags       = local.tags
}

resource "aws_ssm_parameter" "slack_client_id" {
  name        = "${local.ssm_slack_prefix}/client-id"
  description = "Slack application client ID."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_client_id_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

module "ssm_parameter_client_secret_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "slack", "client-secret"]
  tags       = local.tags
}

resource "aws_ssm_parameter" "slack_client_secret" {
  name        = "${local.ssm_slack_prefix}/client-secret"
  description = "Slack application client secret."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_client_secret_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

module "ssm_parameter_signing_secret_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "slack", "signing-secret"]
  tags       = local.tags
}

resource "aws_ssm_parameter" "slack_signing_secret" {
  name        = "${local.ssm_slack_prefix}/signing-secret"
  description = "Slack application signing secret."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_client_secret_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

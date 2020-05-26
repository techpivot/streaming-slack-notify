module "ssm_parameter_client_id_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ssm", "slack", "client-id"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_ssm_parameter" "slack_client_id" {
  name        = "${local.ssm_slack_prefix}/client_id"
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
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ssm", "slack", "client-secret"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_ssm_parameter" "slack_client_secret" {
  name        = "${local.ssm_slack_prefix}/client_secret"
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
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ssm", "slack", "signing-secret"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_ssm_parameter" "slack_signing_secret" {
  name        = "${local.ssm_slack_prefix}/signing_secret"
  description = "Slack application signing secret."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_client_secret_label.tags

  overwrite = false
  lifecycle {
    ignore_changes = [value]
  }
}

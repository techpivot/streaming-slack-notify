module "ssm_parameter_faunadb_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "faunadb", "server-secret"]
  tags       = local.tags
}

#
# We stub out the actual parameter with a dummy value such that we can potentially reference
# paths from a consistent location.
#
resource "aws_ssm_parameter" "faunadb_server_secret" {
  name        = "${local.ssm_faunadb_prefix}/server-secret"
  description = "FaunaDB server side secret used for posting stats into the stats collection."
  type        = "SecureString"
  value       = "dummy"
  tags        = module.ssm_parameter_faunadb_label.tags
  overwrite   = false

  lifecycle {
    ignore_changes = [value]
  }
}

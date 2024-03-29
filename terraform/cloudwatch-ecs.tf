module "ecs_cloudwatch_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["server", "logs"]
  tags       = local.tags
}

# These logs are pretty hefty currently. We can investigate turning off debug at some point.
resource "aws_cloudwatch_log_group" "ecs_instance" {
  name              = module.ecs_cloudwatch_label.id
  retention_in_days = 7
  tags              = module.ecs_cloudwatch_label.tags
}

module "ecs_cloudwatch_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["server", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "ecs_instance" {
  name              = module.ecs_cloudwatch_label.id
  retention_in_days = 60
  tags              = module.ecs_cloudwatch_label.tags
}

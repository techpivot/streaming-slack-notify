module "ecs_cloudwatch_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ecs", "logs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_cloudwatch_log_group" "ecs_instance" {
  name = module.ecs_cloudwatch_label.id
  tags = module.ecs_cloudwatch_label.tags
}

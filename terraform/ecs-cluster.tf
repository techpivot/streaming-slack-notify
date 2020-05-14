module "ecs_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ecs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

data "template_file" "task_definition" {
  template = file("${path.module}/data/task-definition.json.tpl")

  vars = {}
}

resource "aws_ecs_cluster" "default" {
  name = "${module.ecs_label.id}-cluster"
  tags = module.ecs_label.tags
}

resource "aws_ecs_task_definition" "default" {
  family                = "${module.ecs_label.name}-task"
  tags                  = module.ecs_label.tags
  network_mode          = "awsvpc"
  memory                = 461
  cpu                   = 2048
  container_definitions = data.template_file.task_definition.rendered
}

resource "aws_ecs_service" "default" {
  name                               = "${module.ecs_label.id}-service"
  cluster                            = aws_ecs_cluster.default.id
  task_definition                    = aws_ecs_task_definition.default.arn
  desired_count                      = 1
  launch_type                        = "EC2"
  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0

  network_configuration {
    subnets = module.vpc.public_subnets
    security_groups = [
      aws_security_group.task.id
    ]
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

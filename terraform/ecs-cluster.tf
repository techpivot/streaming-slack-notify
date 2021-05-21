module "ecs_cluster_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  name       = "ecs"
  attributes = ["cluster"]
  tags       = local.tags
}

resource "aws_ecs_cluster" "default" {
  name = module.ecs_cluster_label.id
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = module.ecs_cluster_label.tags
}

module "ecs_service_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  name       = "ecs"
  attributes = ["service"]
  tags       = local.tags
}

resource "aws_ecs_service" "default" {
  name            = module.ecs_service_label.id
  cluster         = aws_ecs_cluster.default.id
  task_definition = aws_ecs_task_definition.default.arn
  desired_count   = 1
  launch_type     = "EC2"

  # iam_role - By default the service will use the Amazon ECS service-linked role.

  placement_constraints {
    type = "distinctInstance"
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

module "ecs_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ecs"]
  tags       = local.tags
}

data "template_file" "task_definition" {
  template = file("${path.module}/data/task-definition.json.tpl")

  vars = {
    repository   = aws_ecr_repository.default.repository_url
    region       = var.region
    logsGroup    = module.ecs_cloudwatch_label.id
    streamPrefix = var.namespace
  }
}

resource "aws_ecs_cluster" "default" {
  name = "${module.ecs_label.id}-cluster"
  setting {
    name  = "containerInsights"
    value = "enabled"
  }
  tags = module.ecs_label.tags
}

resource "aws_ecs_task_definition" "default" {
  family        = "${module.ecs_label.id}-task"
  tags          = module.ecs_label.tags
  network_mode  = "awsvpc"
  task_role_arn = module.ecs_iam_task_role.arn

  # The amount (in MiB) of memory to present to the container. If your container attempts to exceed the
  # memory specified here, the container is killed. The total amount of memory reserved for all containers
  # within a task must be lower than the task memory value, if one is specified. This parameter maps to
  # Memory in the Create a container section of the Docker Remote API and the --memory option to docker run.
  # Need to specify container or task. For now, let's put this on the container.
  memory                = 440
  cpu                   = 2048
  container_definitions = data.template_file.task_definition.rendered
}

resource "aws_ecs_service" "default" {
  name                               = "${module.ecs_label.id}-service"
  cluster                            = aws_ecs_cluster.default.id
  task_definition                    = aws_ecs_task_definition.default.arn
  desired_count                      = 1 # @todo fix potentially
  launch_type                        = "EC2"
  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0

  # iam_role - By default the service will use the Amazon ECS service-linked role.

  network_configuration {
    subnets = module.vpc.public_subnets
    security_groups = [
      aws_security_group.ecs_service.id
    ]
  }

  lifecycle {
    ignore_changes = [desired_count]
  }
}

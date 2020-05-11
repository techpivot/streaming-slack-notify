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

resource "aws_ecs_cluster" "default" {
  name = "${module.ecs_label.id}-cluster"
  tags = module.ecs_label.tags
}

resource "aws_ecs_task_definition" "default" {
  family = "${module.ecs_label.name}-task"
  tags   = module.ecs_label.tags

  container_definitions = <<EOF
[
  {
    "name": "hello_world",
    "image": "hello-world",
    "cpu": 0,
    "memory": 128,
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-region": "us-west-2",
        "awslogs-group": "hello_world",
        "awslogs-stream-prefix": "complete-ecs"
      }
    }
  }
]
EOF
}

resource "aws_ecs_service" "default" {
  name                               = "${module.ecs_label.id}-service"
  cluster                            = aws_ecs_cluster.default.id
  task_definition                    = aws_ecs_task_definition.default.arn
  desired_count                      = 1
  launch_type                        = "EC2"
  deployment_maximum_percent         = 100
  deployment_minimum_healthy_percent = 0

  lifecycle {
    ignore_changes = [task_definition]
  }
}

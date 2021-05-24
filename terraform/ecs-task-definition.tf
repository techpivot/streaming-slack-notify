module "ecs_task_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  name       = "ecs"
  attributes = ["task", "server"]
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

resource "aws_ecs_task_definition" "default" {
  family = module.ecs_task_label.id
  tags   = module.ecs_task_label.tags

  # We use the host mode to allow public access as we launch the instances in the public subnet. Currently,
  # all security groups restrict inbound access. Only external outbound access is currently allowed. This
  # allows our container task to utilize the public IP.
  network_mode = "host"

  task_role_arn = module.ecs_iam_task_role.arn

  # Note: We currently don't need a task execution role
  # Ref: https://docs.aws.amazon.com/AmazonECS/latest/userguide/task_execution_IAM_role.html
  #execution_role_arn = module.ecs_iam_task_execution_role.arn

  # The amount (in MiB) of memory to present to the container. If your container attempts to exceed the
  # memory specified here, the container is killed. The total amount of memory reserved for all containers
  # within a task must be lower than the task memory value, if one is specified. This parameter maps to
  # Memory in the Create a container section of the Docker Remote API and the --memory option to docker run.
  # Need to specify container or task. For now, let's put this on the container.
  memory                = 440
  cpu                   = 2048
  container_definitions = data.template_file.task_definition.rendered
}
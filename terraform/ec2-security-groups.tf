module "ecs_sg_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["sg", "ecs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_security_group" "ecs_instance" {
  name        = "${var.name}-ecs-instance"
  description = "Security group for the EC2 instance running ECS"
  vpc_id      = module.vpc.vpc_id
  tags        = module.ecs_sg_label.tags
}

resource "aws_security_group_rule" "ecs_instance_out_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_instance.id
}

module "task_sg_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["sg", "task"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_security_group" "task" {
  name        = "${var.name}-container"
  description = "Security group for the streaming-slack-notify service containers"
  vpc_id      = module.vpc.vpc_id
  tags        = module.task_sg_label.tags
}

resource "aws_security_group_rule" "task_egress" {
  type              = "egress"
  description       = "Allow outbound internet access to query Amazon SQS, GitHub and post to Slack"
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.task.id
}

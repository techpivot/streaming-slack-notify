module "aws_security_group_ecs_instance_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["sg", "ecs", "instance"]
  tags       = local.tags
}

resource "aws_security_group" "ecs_instance" {
  name        = module.aws_security_group_ecs_instance_label.id
  description = "Security group for the EC2 instance running ECS"
  vpc_id      = module.vpc.vpc_id
  tags        = module.aws_security_group_ecs_instance_label.tags
}

resource "aws_security_group_rule" "ecs_instance_out_all" {
  type              = "egress"
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_instance.id
}

module "aws_security_group_ecs_task_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["sg", "task"]
  tags       = local.tags
}

resource "aws_security_group" "ecs_service" {
  name        = module.aws_security_group_ecs_task_label.id
  description = "Security group for the streaming-slack-notify ECS service"
  vpc_id      = module.vpc.vpc_id
  tags        = module.aws_security_group_ecs_task_label.tags
}

resource "aws_security_group_rule" "task_egress" {
  type              = "egress"
  description       = "Allow outbound internet access to query Amazon SQS, GitHub and post to Slack"
  from_port         = 0
  to_port           = 65535
  protocol          = "tcp"
  cidr_blocks       = ["0.0.0.0/0"]
  security_group_id = aws_security_group.ecs_service.id
}

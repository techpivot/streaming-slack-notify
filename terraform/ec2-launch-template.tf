data "aws_ami" "ecs" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-x86_64-ebs"]
  }

  filter {
    name   = "root-device-type"
    values = ["ebs"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }

  owners = ["amazon"]
}

data "template_file" "user_data" {
  template = file("${path.module}/data/user-data.sh")

  vars = {
    aws_ecs_cluster = aws_ecs_cluster.default.name
  }
}

module "ec2_ecs_instance_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ecs", "instance"]
  tags       = local.tags
}

module "ec2_ecs_instance_volume_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ecs", "volume"]
  tags       = local.tags
}

resource "aws_launch_template" "default" {
  name = "${var.namespace}-ecs-launch-template"

  capacity_reservation_specification {
    capacity_reservation_preference = "open"
  }

  instance_market_options {
    market_type = "spot"
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_iam_instance_profile.name
  }

  disable_api_termination              = true
  ebs_optimized                        = true
  instance_initiated_shutdown_behavior = "terminate"
  image_id                             = data.aws_ami.ecs.id
  vpc_security_group_ids               = [aws_security_group.ecs_instance.id]
  user_data                            = base64encode(data.template_file.user_data.rendered)
  key_name                             = aws_key_pair.default.key_name

  # We include this in the base template; however, override as necessary when incorporating with
  # a spot fleet request.
  instance_type = "t3a.nano"

  # Note: We don't specify the subnet ID as we want to explicitly utilize the maximum pool to ensure
  # spot availability

  # Note: Don't specify network_interfaces here as this will conflict with the spot fleet launch config templates

  monitoring {
    # No need for deteailed monitoring. This also costs extra.
    enabled = false
  }

  tag_specifications {
    resource_type = "instance"
    tags          = module.ec2_ecs_instance_label.tags
  }

  tag_specifications {
    resource_type = "volume"
    tags          = module.ec2_ecs_instance_volume_label.tags
  }
}

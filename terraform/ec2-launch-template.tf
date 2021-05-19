#
# In order to reduce cost, we reduce the size of the 30GB ECS instances. In order to do this:
#
#  1) Create a new t4g nano instance.
#      - Select the latest AMI for ECS/HVM/arm64. This can be found on the AMIs section.
#  2) Login to the instance. Currently, the base image takes around 1.7GB
#      > df -H
#      >  /dev/nvme0n1p1     32G  1.7G   30G   6% /
#  3) Create new 4GB Volume
#  4) Attach volume to the instance. Confirm via `fdisk -l`
#  5) sudo mkfs -t ext4 /dev/nvme1n1
#  6) sudo mkdir /mnt/new-volume
#  7) sudo mount /dev/nvme1n1 /mnt/new-volume
#  8) sudo yum install -y rsync grub-install
#  9) sudo rsync -axv / /mnt/new-volume/
# 10) sudo grub-install --root-directory=/mnt/new-volume/ --force /dev/nvme1n1
# Ref Guide: https://medium.com/@m.yunan.helmy/decrease-the-size-of-ebs-volume-in-your-ec2-instance-ea326e951bce

data "aws_ami" "ecs" {
  most_recent = true

  filter {
    name   = "name"
    values = ["amzn2-ami-ecs-hvm-*-arm64-ebs"]
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

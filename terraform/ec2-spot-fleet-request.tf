module "spot_fleet_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["spot-fleet"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_spot_fleet_request" "default" {
  iam_fleet_role                      = aws_iam_role.spotfleet_role.arn
  replace_unhealthy_instances         = true
  terminate_instances_with_expiration = true
  valid_until                         = "9999-12-31T23:59:59Z"
  excess_capacity_termination_policy  = "Default"
  instance_interruption_behaviour     = "terminate"
  fleet_type                          = "maintain"

  target_capacity     = 2 # instances
  spot_price          = 0.002
  allocation_strategy = "lowestPrice" # [ "diversified", "lowestPrice" ]

  launch_template_config {
    launch_template_specification {
      id      = aws_launch_template.default.id
      version = aws_launch_template.default.latest_version
    }
    overrides {
      instance_type = "t3a.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[0]
    }
    overrides {
      instance_type = "t3a.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[1]
    }
    overrides {
      instance_type = "t3a.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[2]
    }
    overrides {
      instance_type = "t3a.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[3]
    }
    overrides {
      instance_type = "t3.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[0]
    }
    overrides {
      instance_type = "t3.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[1]
    }
    overrides {
      instance_type = "t3.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[2]
    }
    overrides {
      instance_type = "t3.nano"
      spot_price    = 0.002
      subnet_id     = module.vpc.public_subnets[3]
    }
  }
}

module "spot_fleet_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["spot-fleet"]
  tags       = local.tags
}

resource "aws_spot_fleet_request" "default" {
  iam_fleet_role                      = module.spot_fleet_tagging_role.arn
  replace_unhealthy_instances         = true
  terminate_instances_with_expiration = true
  valid_until                         = "9999-12-31T23:59:59Z"
  excess_capacity_termination_policy  = "Default"
  instance_interruption_behaviour     = "terminate"
  fleet_type                          = "maintain"

  target_capacity     = var.spot_fleet_target_capacity
  spot_price          = 0.002
  allocation_strategy = "lowestPrice" # [ "diversified", "lowestPrice" ]

  launch_template_config {
    launch_template_specification {
      id      = aws_launch_template.default.id
      version = aws_launch_template.default.latest_version
    }

    dynamic "overrides" {
      for_each = local.ecs_launch_config_overrides

      content {
        instance_type = overrides.value.instance_type
        spot_price    = overrides.value.spot_price
        subnet_id     = overrides.value.subnet_id
      }
    }
  }
}

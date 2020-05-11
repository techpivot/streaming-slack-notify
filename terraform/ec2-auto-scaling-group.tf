/*

resource "aws_autoscaling_group" "asg" {
  name = "${var.name}-asg"

  launch_configuration = aws_launch_configuration.instance.name
  vpc_zone_identifier  = module.vpc.public_subnets
  max_size             = var.ecs_asg_max_size
  min_size             = var.ecs_asg_min_size
  desired_capacity     = var.ecs_asg_desired_capacity

  health_check_grace_period = 300
  health_check_type         = "EC2"

  lifecycle {
    create_before_destroy = true
  }
}
*/
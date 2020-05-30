data "aws_iam_policy_document" "ecs_instance_policy" {
  statement {
    sid = "CloudwatchPutMetricData"

    actions = [
      "cloudwatch:PutMetricData",
    ]

    resources = [
      "*",
    ]
  }

  statement {
    sid = "InstanceLogging"

    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
    ]

    resources = [
      aws_cloudwatch_log_group.ecs_instance.arn
    ]
  }
}

resource "aws_iam_policy" "ecs_instance_policy" {
  name   = "${var.name}-ecs-instance-policy"
  path   = "/"
  policy = data.aws_iam_policy_document.ecs_instance_policy.json
}

resource "aws_iam_role" "ecs_instance" {
  name                  = "${var.name}-ecs-instance-role"
  assume_role_policy    = data.aws_iam_policy_document.ec2_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role_policy_attachment" "ecs_iam_role_policy_attachment_ecs" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_role_policy_attachment" "ecs_iam_role_policy_attachment_ssm" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = "arn:aws:iam::aws:policy/AmazonSSMManagedInstanceCore"
}

resource "aws_iam_role_policy_attachment" "ecs_iam_role_policy_attachment_cloudwatch" {
  role       = aws_iam_role.ecs_instance.name
  policy_arn = aws_iam_policy.ecs_instance_policy.arn
}

resource "aws_iam_instance_profile" "instance" {
  name = "${var.name}-instance-profile"
  role = aws_iam_role.ecs_instance.name
}

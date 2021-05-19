data "aws_iam_policy_document" "ecs_iam_instance_role_policy_1" {
  statement {
    sid    = "AllowLoggingToCloudWatch"
    effect = "Allow"
    resources = [
      aws_cloudwatch_log_group.ecs_instance.arn
    ]
    actions = [
      "logs:CreateLogGroup",
      "logs:CreateLogStream",
      "logs:PutLogEvents",
      "logs:DescribeLogStreams",
    ]
  }
}

data "aws_iam_policy_document" "ecs_iam_instance_role_policy_2" {
  statement {
    sid    = "AllowRecordingCloudwatchMetricData"
    effect = "Allow"
    resources = [
      "*"
    ]
    actions = [
      "cloudwatch:PutMetricData"
    ]
  }
}

# Ref: https://docs.aws.amazon.com/AmazonECS/latest/developerguide/instance_IAM_role.html
module "ecs_iam_instance_role" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "ecs-instance"
  attributes = ["role"]

  policy_description = "Allow access to push metrics and logs into CloudWatch"
  role_description   = "IAM service role that is assumed by the ECS host instance"

  principals = {
    Service = ["ec2.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.ecs_iam_instance_role_policy_1.json,
    data.aws_iam_policy_document.ecs_iam_instance_role_policy_2.json,
  ]
}

resource "aws_iam_role_policy_attachment" "ecs_iam_role_policy_attachment_ecs" {
  role       = module.ecs_iam_instance_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2ContainerServiceforEC2Role"
}

resource "aws_iam_instance_profile" "ecs_iam_instance_profile" {
  role = module.ecs_iam_instance_role.name
  name = "${module.ecs_iam_instance_role.name}-instance-profile"
}

data "aws_iam_policy_document" "ecs_iam_task_role_policy_1" {
  statement {
    sid    = "AllowEcsTaskToRetrieveSsmParameters"
    effect = "Allow"
    resources = [
      aws_ssm_parameter.queue_url.arn,
      aws_ssm_parameter.github_app_client_secret.arn,
      aws_ssm_parameter.github_app_private_key.arn,
      aws_ssm_parameter.faunadb_server_secret.arn,
    ]
    actions = [
      "ssm:GetParameter"
    ]
  }
}

data "aws_iam_policy_document" "ecs_iam_task_role_policy_2" {
  statement {
    sid    = "AllowLambdaSendReceiveFromSqs"
    effect = "Allow"
    resources = [
      aws_sqs_queue.default.arn,
    ]
    actions = [
      "sqs:ChangeMessageVisibility",
      "sqs:DeleteMessage",
      "sqs:SendMessage",
      "sqs:ReceiveMessage",
    ]
  }
}

module "ecs_iam_task_role" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "ecs-task"
  attributes = ["role"]

  policy_description = "Allow access to retrieve SSM secrets and query SQS"
  role_description   = "IAM service role that is assumed by the ECS container task runners"

  principals = {
    Service = ["ecs-tasks.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.ecs_iam_task_role_policy_1.json,
    data.aws_iam_policy_document.ecs_iam_task_role_policy_2.json,
  ]
}

resource "aws_iam_role_policy_attachment" "ecs_iam_task_role_policy_attachment_ecs" {
  role       = module.ecs_iam_task_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonECSTaskExecutionRolePolicy"
}

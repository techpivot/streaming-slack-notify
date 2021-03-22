data "aws_iam_policy_document" "ecs_iam_task_role_policy_1" {
  statement {
    sid    = "AllowEcsTaskToRetrieveSsmParameters"
    effect = "Allow"
    resources = [
      aws_ssm_parameter.queue_url.arn,
    ]
    actions = [
      "ssm:GetParameter"
    ]
  }
}

data "aws_iam_policy_document" "ecs_iam_task_role_policy_2" {
  statement {
    sid    = "AllowLambdaWriteToSlackDynamodbTable"
    effect = "Allow"

    resources = [
      aws_dynamodb_table.slack.arn,
    ]
    actions = [
      "dynamodb:GetItem",
      "dynamodb:PutItem"
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

  policy_description = "Allow access to retrieve SSM Slack secrets and update DynamoDB"
  role_description   = "IAM service role that is assumed by the ECS container task runners"

  principals = {
    Service = ["ecs-tasks.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.ecs_iam_task_role_policy_1.json,
    data.aws_iam_policy_document.ecs_iam_task_role_policy_2.json,
  ]
}

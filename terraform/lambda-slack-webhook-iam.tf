
data "aws_iam_policy_document" "iam_lambda_slack_webhook_1" {
  statement {
    sid    = "AllowLambdaToWriteCloudWatchLogEvents"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.log_group_lambda_slack_webhook.arn}:*"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_slack_webhook_2" {
  statement {
    sid    = "AllowLambdaToGetSsmSlackSecrets"
    effect = "Allow"
    resources = [
      aws_ssm_parameter.slack_signing_secret.arn,
    ]
    actions = [
      "ssm:GetParameter"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_slack_webhook_3" {
  statement {
    sid    = "AllowLambdaManageSlackDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.slack.arn,
    ]
    actions = [
      "dynamodb:PutItem",
      "dynamodb:DeleteItem",
    ]
  }
}

module "iam_lambda_slack_webhook" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "lambda-slack-webhook"
  attributes = ["role"]

  policy_description = "Allow access to update DynamoDB and write logs to CloudWatch"
  role_description   = "IAM service role that is assumed by the lambda-slack-webhook lambda function"

  principals = {
    Service = ["lambda.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.iam_lambda_slack_webhook_1.json,
    data.aws_iam_policy_document.iam_lambda_slack_webhook_2.json,
    data.aws_iam_policy_document.iam_lambda_slack_webhook_3.json,
  ]
}

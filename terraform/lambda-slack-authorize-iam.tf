
data "aws_iam_policy_document" "iam_lambda_slack_authorize_1" {
  statement {
    sid    = "AllowLambdaToWriteCloudWatchLogEvents"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.log_group_lambda_slack_authorize.arn}:*"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_slack_authorize_2" {
  statement {
    sid    = "AllowLambdaToGetSsmSlackSecrets"
    effect = "Allow"
    resources = [
      aws_ssm_parameter.slack_client_id.arn,
      aws_ssm_parameter.slack_client_secret.arn,
      aws_ssm_parameter.slack_signing_secret.arn,
    ]
    actions = [
      "ssm:GetParameters"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_slack_authorize_3" {
  statement {
    sid    = "AllowLambdaWriteToSlackDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.slack.arn,
    ]
    actions = [
      "dynamodb:PutItem"
    ]
  }
}

module "iam_lambda_slack_authorize" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "lambda-slack-authorize"
  attributes = ["role"]

  policy_description = "Allow access to retrieve SSM Slack secrets, update DynamoDB, and write logs to CloudWatch"
  role_description   = "IAM service role that is assumed by the lambda-slack-authorize lambda function"

  principals = {
    Service = ["lambda.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.iam_lambda_slack_authorize_1.json,
    data.aws_iam_policy_document.iam_lambda_slack_authorize_2.json,
    data.aws_iam_policy_document.iam_lambda_slack_authorize_3.json,
  ]
}

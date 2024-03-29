
data "aws_iam_policy_document" "iam_lambda_github_webhook_1" {
  statement {
    sid    = "AllowLambdaToWriteCloudWatchLogEvents"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.log_group_lambda_github_webhook.arn}:*"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_webhook_2" {
  statement {
    sid    = "AllowLambdaToGetSsmGithubSecrets"
    effect = "Allow"
    resources = [
      aws_ssm_parameter.github_app_webhook_secret.arn,
    ]
    actions = [
      "ssm:GetParameter" // Get GitHub web app secret
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_webhook_3" {
  statement {
    sid    = "AllowLambdaManageGithubDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.github.arn,
    ]
    actions = [
      "dynamodb:GetItem",    // For workflow run
      "dynamodb:UpdateItem", // App installation/change
      "dynamodb:DeleteItem", // App uninstall
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_webhook_4" {
  statement {
    sid    = "AllowLambdaReadSlackbDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.slack.arn,
    ]
    actions = [
      "dynamodb:GetItem", // For retrieving the slack app ID associated with github id
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_webhook_5" {
  statement {
    sid    = "AllowLambdaPushToSqs"
    effect = "Allow"
    resources = [
      aws_sqs_queue.default.arn,
    ]
    actions = [
      "sqs:SendMessage", // For sending a message to the queue
    ]
  }
}

module "iam_lambda_github_webhook" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "lambda-github-webhook"
  attributes = ["role"]

  policy_description = "Allow access to update DynamoDB and write logs to CloudWatch"
  role_description   = "IAM service role that is assumed by the lambda-github-webhook lambda function"

  principals = {
    Service = ["lambda.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.iam_lambda_github_webhook_1.json,
    data.aws_iam_policy_document.iam_lambda_github_webhook_2.json,
    data.aws_iam_policy_document.iam_lambda_github_webhook_3.json,
    data.aws_iam_policy_document.iam_lambda_github_webhook_4.json,
    data.aws_iam_policy_document.iam_lambda_github_webhook_5.json,
  ]
}

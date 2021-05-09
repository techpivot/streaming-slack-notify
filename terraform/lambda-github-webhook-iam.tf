
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
      "ssm:GetParameter"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_webhook_3" {
  statement {
    sid    = "AllowLambdaManagegithubDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.github.arn,
    ]
    actions = [
      "dynamodb:UpdateItem",
      "dynamodb:DeleteItem",
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
  ]
}


# github_installation_id | slack_access_token |
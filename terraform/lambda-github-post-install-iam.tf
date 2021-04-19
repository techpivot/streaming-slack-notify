
data "aws_iam_policy_document" "iam_lambda_github_post_install_1" {
  statement {
    sid    = "AllowLambdaToWriteCloudWatchLogEvents"
    effect = "Allow"
    actions = [
      "logs:CreateLogStream",
      "logs:PutLogEvents",
    ]
    resources = [
      "${aws_cloudwatch_log_group.log_group_lambda_github_post_install.arn}:*"
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_post_install_2" {
  statement {
    sid    = "AllowLambdaManageGithubDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.github.arn,
    ]
    actions = [
      "dynamodb:GetItem",
      "dynamodb:UpdateItem",
    ]
  }
}

data "aws_iam_policy_document" "iam_lambda_github_post_install_3" {
  statement {
    sid    = "AllowLambdaManageSlackDynamodbTable"
    effect = "Allow"
    resources = [
      aws_dynamodb_table.slack.arn,
    ]
    actions = [
      "dynamodb:GetItem",
    ]
  }
}

module "iam_lambda_github_post_install" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled    = true
  namespace  = var.namespace
  name       = "lambda-github-post_install"
  attributes = ["role"]

  policy_description = "Allow access to update DynamoDB and write logs to CloudWatch"
  role_description   = "IAM service role that is assumed by the lambda-github-post-install lambda function"

  principals = {
    Service = ["lambda.amazonaws.com"]
  }

  policy_documents = [
    data.aws_iam_policy_document.iam_lambda_github_post_install_1.json,
    data.aws_iam_policy_document.iam_lambda_github_post_install_2.json,
    data.aws_iam_policy_document.iam_lambda_github_post_install_3.json,
  ]
}


# github_installation_id | slack_access_token |
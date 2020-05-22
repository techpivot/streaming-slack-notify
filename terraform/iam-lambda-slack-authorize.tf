data "aws_iam_policy_document" "lambda_slack_authorize_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_slack_authorize_role" {
  name                  = "${var.name}-lambda-slack-authorize-service-role"
  assume_role_policy    = data.aws_iam_policy_document.lambda_slack_authorize_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_policy" "lambda_slack_authorize_role_cloudwatch_policy" {
  name        = "${var.name}-lambda-slack-authorize-cloudwatch-policy"
  path        = "/"
  description = "IAM policy that permits logging to a specific CloudWatch log"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "${aws_cloudwatch_log_group.log_group_lambda_slack_authorize.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_slack_authorize_cloudwatch_role_attachment" {
  role       = aws_iam_role.lambda_slack_authorize_role.name
  policy_arn = aws_iam_policy.lambda_slack_authorize_role_cloudwatch_policy.arn
}

resource "aws_iam_policy" "lambda_slack_authorize_role_ssm_policy" {
  name        = "${var.name}-lambda-slack-authorize-ssm-policy"
  path        = "/"
  description = "IAM policy that permits reading the Slack application authorization secrets"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "ssm:GetParameters"
      ],
      "Resource": [
        "${aws_ssm_parameter.slack_client_id.arn}",
        "${aws_ssm_parameter.slack_client_secret.arn}",
        "${aws_ssm_parameter.slack_signing_secret.arn}"
      ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_slack_authorize_ssm_role_attachment" {
  role       = aws_iam_role.lambda_slack_authorize_role.name
  policy_arn = aws_iam_policy.lambda_slack_authorize_role_ssm_policy.arn
}


resource "aws_iam_policy" "lambda_slack_authorize_role_dynamodb_policy" {
  name        = "${var.name}-lambda-slack-authorize-dynamodb-policy"
  path        = "/"
  description = "IAM policy that permits the Lambda authorize function to execute PutItem on the DynamoDB table"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "dynamodb:PutItem"
      ],
      "Resource": [
        "${aws_dynamodb_table.default.arn}"
      ],
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_slack_authorize_dynamodb_role_attachment" {
  role       = aws_iam_role.lambda_slack_authorize_role.name
  policy_arn = aws_iam_policy.lambda_slack_authorize_role_dynamodb_policy.arn
}
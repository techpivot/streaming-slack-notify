data "aws_iam_policy_document" "lambda_slack_oauth2_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["lambda.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "lambda_slack_oauth2" {
  name                  = "${var.name}-lambda-slack-oauth2-service-role"
  assume_role_policy    = data.aws_iam_policy_document.lambda_slack_oauth2_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_policy" "lambda_slack_oauth2_logging_policy" {
  name        = "${var.name}-lambda-slack-oauth2-cloudwatch-policy"
  path        = "/"
  description = "IAM policy that permits logging to a specific CloudWatch log"

  policy = <<EOF
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "${aws_cloudwatch_log_group.log_group_slack_oauth2.arn}",
      "Effect": "Allow"
    }
  ]
}
EOF
}

resource "aws_iam_role_policy_attachment" "lambda_logs" {
  role       = aws_iam_role.lambda_slack_oauth2.name
  policy_arn = aws_iam_policy.lambda_slack_oauth2_logging_policy.arn
}
resource "aws_iam_role" "lambda_github_app_webhook_role" {
  name                  = "${var.name}-github-app-webhook-service-role"
  assume_role_policy    = data.aws_iam_policy_document.lambda_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

###
### Policies are pretty specific to the role so let's put them inline.
###

resource "aws_iam_role_policy" "lambda_github_app_webhook_role_cloudwatch_policy" {
  name = "cloudwatch-policy"
  role = aws_iam_role.lambda_github_app_webhook_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "${aws_cloudwatch_log_group.log_group_lambda_github_app_webhook.arn}",
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

resource "aws_iam_role_policy" "lambda_github_app_webhook_role_ssm_policy" {
  name = "ssm-policy"
  role = aws_iam_role.lambda_github_app_webhook_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "ssm:GetParameter"
        ],
        "Resource": [
          "${aws_ssm_parameter.github_app_webhook_secret.arn}"
        ],
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

resource "aws_iam_role_policy" "lambda_github_app_webhook_role_dynamodb_policy" {
  name = "dynamodb-policy"
  role = aws_iam_role.lambda_github_app_webhook_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "dynamodb:PutItem"
        ],
        "Resource": [
          "${aws_dynamodb_table.github.arn}"
        ],
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

resource "aws_iam_role" "lambda_github_app_role" {
  name                  = "${var.name}-lambda-github-app-service-role"
  assume_role_policy    = data.aws_iam_policy_document.lambda_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

###
### Policies are pretty specific to the role so let's put them inline.
###

resource "aws_iam_role_policy" "lambda_github_app_role_cloudwatch_policy" {
  name = "cloudwatch-policy"
  role = aws_iam_role.lambda_github_app_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "app": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "${aws_cloudwatch_log_group.log_group_lambda_github_app.arn}",
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

resource "aws_iam_role_policy" "lambda_github_app_role_dynamodb_policy" {
  name = "dynamodb-policy"
  role = aws_iam_role.lambda_github_app_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "app": [
          "dynamodb:GetItem",
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


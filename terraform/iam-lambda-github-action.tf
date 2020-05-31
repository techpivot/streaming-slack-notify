resource "aws_iam_role" "lambda_github_action_role" {
  name                  = "${var.name}-lambda-github-action-service-role"
  assume_role_policy    = data.aws_iam_policy_document.lambda_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

###
### Policies are pretty specific to the role so let's put them inline.
###

resource "aws_iam_role_policy" "lambda_github_action_role_cloudwatch_policy" {
  name = "cloudwatch-policy"
  role = aws_iam_role.lambda_github_action_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ],
        "Resource": "${aws_cloudwatch_log_group.log_group_lambda_github_action.arn}",
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

resource "aws_iam_role_policy" "lambda_github_action_role_dynamodb_policy" {
  name = "dynamodb-policy"
  role = aws_iam_role.lambda_github_action_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
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


resource "aws_iam_role_policy" "lambda_github_action_role_sqs_policy" {
  name = "sqs-policy"
  role = aws_iam_role.lambda_github_action_role.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "sqs:sendMessage"
        ],
        "Resource": [
          "${aws_sqs_queue.default.arn}"
        ],
        "Effect": "Allow"
      }
    ]
  }
  EOF
}

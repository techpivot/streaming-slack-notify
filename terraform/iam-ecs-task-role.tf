resource "aws_iam_role" "ecs_task" {
  name                  = "${var.name}-ecs-task-role"
  assume_role_policy    = data.aws_iam_policy_document.ecs_tasks_assume_role_policy.json
  force_detach_policies = true

  lifecycle {
    create_before_destroy = true
  }
}

resource "aws_iam_role_policy" "ecs_task_dynamodb_policy" {
  name = "dynamodb-policy"
  role = aws_iam_role.ecs_task.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "dynamodb:PutItem"
        ],
        "Effect": "Allow",
        "Resource": "${aws_dynamodb_table.default.arn}"
      }
    ]
  }
  EOF
}

resource "aws_iam_role_policy" "ecs_task_ssm_policy" {
  name = "ssm-parameter-store-policy"
  role = aws_iam_role.ecs_task.id

  policy = <<-EOF
  {
    "Version": "2012-10-17",
    "Statement": [
      {
        "Action": [
          "dynamodb:GetParameter"
        ],
        "Effect": "Allow",
        "Resource": "${aws_ssm_parameter.queue_url.arn}"
      }
    ]
  }
  EOF
}

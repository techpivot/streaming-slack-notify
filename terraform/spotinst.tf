
module "spotinst_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = "spotinst"
  delimiter          = var.delimiter
  attributes         = var.attributes
  tags               = var.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_iam_policy" "spotinst" {
  name   = "Spot-Policy"
  path   = "/"
  policy = file("${path.module}/policies/spotinst.json")
}

resource "aws_iam_role" "spotinst" {
  name               = "Spot-Role"
  assume_role_policy = <<-EOT
  {
      "Version": "2012-10-17",
      "Statement": [
          {
          "Effect": "Allow",
          "Principal": {
              "AWS": "arn:aws:iam::922761411349:root"
          },
          "Action": "sts:AssumeRole",
          "Condition": {
              "StringEquals": {
              "sts:ExternalId": "${var.spotinst_external_id}"
              }
          }
          }
      ]
  }
  EOT
  tags               = module.spotinst_label.tags
}

resource "aws_iam_role_policy_attachment" "spotinst" {
  role       = aws_iam_role.spotinst.name
  policy_arn = aws_iam_policy.spotinst.arn
}

module "spot_fleet_tagging_role" {
  source  = "cloudposse/iam-role/aws"
  version = "0.9.3"

  enabled   = true
  namespace = var.namespace
  name      = "aws-ec2-spot-fleet-tagging-role"

  role_description      = "IAM role used by the spot fleet service to launch and tag instances"
  policy_description    = ""
  policy_document_count = 0

  principals = {
    Service = ["spotfleet.amazonaws.com"]
  }
}

resource "aws_iam_role_policy_attachment" "spotfleet_role_policy_attachment" {
  role       = module.spot_fleet_tagging_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2SpotFleetTaggingRole"
}

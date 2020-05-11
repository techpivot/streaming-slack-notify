data "aws_iam_policy_document" "spotfleet_assume_role_policy" {
  statement {
    actions = ["sts:AssumeRole"]

    principals {
      type        = "Service"
      identifiers = ["spotfleet.amazonaws.com"]
    }
  }
}

resource "aws_iam_role" "spotfleet_role" {
  name               = "aws-ec2-spot-fleet-tagging-role"
  assume_role_policy = data.aws_iam_policy_document.spotfleet_assume_role_policy.json
}

resource "aws_iam_role_policy_attachment" "spotfleet_role_policy_attachment" {
  role       = aws_iam_role.spotfleet_role.name
  policy_arn = "arn:aws:iam::aws:policy/service-role/AmazonEC2SpotFleetTaggingRole"
}

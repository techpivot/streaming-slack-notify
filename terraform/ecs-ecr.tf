module "ecr_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["ecr"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_ecr_repository" "default" {
  name = module.ecr_label.id
  tags = module.ecr_label.tags
}

resource "aws_ecr_lifecycle_policy" "default" {
  repository = aws_ecr_repository.default.name
  policy     = file("${path.module}/data/ecs-ecr-lifecycle-policy.json")
}

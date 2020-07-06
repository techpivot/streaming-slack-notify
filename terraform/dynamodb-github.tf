module "dynamodb_github_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["github-auths"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_dynamodb_table" "github" {
  name           = module.dynamodb_github_label.id
  read_capacity  = var.dynamodb_github_read_capacity
  write_capacity = var.dynamodb_github_write_capacity
  hash_key       = "owner"
  range_key      = "updated_at"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "owner"
    type = "S"
  }

  attribute {
    name = "updated_at"
    type = "S"
  }

  tags = module.dynamodb_github_label.tags
}

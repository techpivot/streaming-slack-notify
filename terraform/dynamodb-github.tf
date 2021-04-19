module "dynamodb_github_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["github"]
  tags       = local.tags
}

resource "aws_dynamodb_table" "github" {
  name           = module.dynamodb_github_label.id
  read_capacity  = var.dynamodb_github_read_capacity
  write_capacity = var.dynamodb_github_write_capacity
  hash_key       = "installation_id"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "installation_id"
    type = "N"
  }

  tags = module.dynamodb_github_label.tags
}

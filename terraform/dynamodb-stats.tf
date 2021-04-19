module "dynamodb_stats_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["stats"]
  tags       = local.tags
}

resource "aws_dynamodb_table" "stats" {
  name           = module.dynamodb_stats_label.id
  read_capacity  = var.dynamodb_stats_read_capacity
  write_capacity = var.dynamodb_stats_write_capacity
  hash_key       = "installation_id"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "installation_id"
    type = "N"
  }

  tags = module.dynamodb_stats_label.tags
}

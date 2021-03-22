module "dynamodb_slack_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["slack"]
  tags       = local.tags
}

resource "aws_dynamodb_table" "slack" {
  name           = module.dynamodb_slack_label.id
  read_capacity  = var.dynamodb_slack_read_capacity
  write_capacity = var.dynamodb_slack_write_capacity
  hash_key       = "api_app_id"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "api_app_id"
    type = "S"
  }

  attribute {
    name = "team_id"
    type = "S"
  }

  global_secondary_index {
    name            = "TeamIdIndex"
    hash_key        = "team_id"
    write_capacity  = 2
    read_capacity   = 2
    projection_type = "KEYS_ONLY"
  }

  tags = module.dynamodb_slack_label.tags
}

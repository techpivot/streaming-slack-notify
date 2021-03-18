module "dynamodb_slack_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["slack-auths"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_dynamodb_table" "slack" {
  name           = module.dynamodb_slack_label.id
  read_capacity  = var.dynamodb_slack_read_capacity
  write_capacity = var.dynamodb_slack_write_capacity
  hash_key       = "id"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "id"
    type = "S"
  }

  attribute {
    name = "team_id"
    type = "S"
  }

  attribute {
    name = "updated_at"
    type = "S"
  }

  global_secondary_index {
    name            = "TeamIdIndex"
    hash_key        = "team_id"
    write_capacity  = 2
    read_capacity   = 2
    projection_type = "KEYS_ONLY"
  }

  global_secondary_index {
    name               = "LastUpdatedIndex"
    hash_key           = "updated_at"
    write_capacity     = 2
    read_capacity      = 2
    projection_type    = "INCLUDE"
    non_key_attributes = ["app_id"]
  }

  tags = module.dynamodb_slack_label.tags
}

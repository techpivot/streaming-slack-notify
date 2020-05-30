module "dynamodb_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = []
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_dynamodb_table" "default" {
  name           = module.dynamodb_label.id
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
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
    write_capacity  = 3
    read_capacity   = 3
    projection_type = "KEYS_ONLY"
  }

  global_secondary_index {
    name               = "LastUpdatedIndex"
    hash_key           = "updated_at"
    write_capacity     = 3
    read_capacity      = 3
    projection_type    = "INCLUDE"
    non_key_attributes = ["app_id"]
  }

  lifecycle {
    ignore_changes = [read_capacity, write_capacity]
  }

  tags = module.dynamodb_label.tags
}

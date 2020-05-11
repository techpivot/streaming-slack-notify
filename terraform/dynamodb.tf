module "dynamodb_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["slack-teams"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_dynamodb_table" "default" {
  name           = module.dynamodb_label.id
  read_capacity  = var.dynamodb_read_capacity
  write_capacity = var.dynamodb_write_capacity
  hash_key       = "Id"

  server_side_encryption {
    enabled = true
  }

  attribute {
    name = "Id"
    type = "S"
  }

  /* Un-indexed attributes */
  /*
  attribute {
    name = "SlackTeamId"
    type = "S"
  }

  attribute {
    name = "SlackAccessToken"
    type = "S"
  }

  attribute {
    name = "SlackAccessTokenScope"
    type = "S"
  }
  */

  tags = module.dynamodb_label.tags
}

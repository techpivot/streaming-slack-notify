
module "base_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = local.dynamodb_table_name
  delimiter          = var.delimiter
  attributes         = var.attributes
  tags               = var.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_dynamodb_table" "default" {
  name           = local.dynamodb_table_name
  read_capacity  = var.read_capacity
  write_capacity = var.write_capacity
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

  tags = module.base_label.tags
}

module "sqs_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["sqs"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_sqs_queue" "default" {
  name                       = module.sqs_label.id
  delay_seconds              = 0
  visibility_timeout_seconds = 30
  max_message_size           = 262144
  message_retention_seconds  = 86400 # 1 day
  receive_wait_time_seconds  = 20
  tags                       = module.sqs_label.tags
}

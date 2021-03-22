module "sqs_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["sqs", "workflows"]
  tags       = local.tags
}

resource "aws_sqs_queue" "default" {
  name                              = module.sqs_label.id
  delay_seconds                     = 0
  visibility_timeout_seconds        = 30
  max_message_size                  = 262144
  message_retention_seconds         = 86400 # 1 day
  receive_wait_time_seconds         = 20
  kms_master_key_id                 = "alias/aws/sqs"
  kms_data_key_reuse_period_seconds = 300
  tags                              = module.sqs_label.tags
}

module "ssm_parameter_queue_url" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ssm", "queue", "url"]
  tags       = local.tags
}

resource "aws_ssm_parameter" "queue_url" {
  name        = "${local.ssm_prefix}/queue-url"
  description = "The SQS queue URL endpoint"
  type        = "SecureString"
  value       = aws_sqs_queue.default.id
  tags        = module.ssm_parameter_client_secret_label.tags
}

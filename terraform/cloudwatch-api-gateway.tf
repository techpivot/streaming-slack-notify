resource "aws_cloudwatch_log_group" "log_group_api_gateway_prod" {
  name              = "/aws/api-gateway/${module.api_gateway_stage_prod_label.id}"
  retention_in_days = 30
  tags              = module.api_gateway_stage_prod_label.tags
}

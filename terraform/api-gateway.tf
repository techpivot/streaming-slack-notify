module "api_gateway_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["api"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_apigatewayv2_api" "default" {
  name          = module.api_gateway_label.id
  description   = "Endpoint for handling OAuth 2.0 Slack requests and initial GitHub action requests"
  protocol_type = "HTTP"
  tags          = module.api_gateway_label.tags
}

resource "aws_apigatewayv2_integration" "api_integration_slack_authorize_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Lambda example"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_slack_authorize.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_slack_oauth_authorize_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"

  # Remove the following snippet once this PR is merged:
  # https://github.com/terraform-providers/terraform-provider-aws/pull/13062
  lifecycle {
    ignore_changes = [passthrough_behavior]
  }
}

resource "aws_apigatewayv2_route" "route_get_authorize" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "GET /authorize"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_slack_authorize_lambda.id}"
}

module "api_gateway_stage_prod_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["api", "gateway", "prod"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_apigatewayv2_stage" "stage_prod" {
  api_id      = aws_apigatewayv2_api.default.id
  description = "Production stage"
  auto_deploy = true
  name        = "prod"
  tags        = module.api_gateway_stage_prod_label.tags

  access_log_settings {
    destination_arn = aws_cloudwatch_log_group.log_group_api_gateway_prod.arn
    format          = replace(file("${path.module}/data/api-gateway-log-format.json.tpl"), "/\n/", "")
  }

  # Temporarily bypassing error
  # https://github.com/terraform-providers/terraform-provider-aws/issues/11148
  lifecycle {
    ignore_changes = [deployment_id, default_route_settings]
  }
}

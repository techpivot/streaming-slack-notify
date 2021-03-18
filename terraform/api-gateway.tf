module "api_gateway_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
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

resource "aws_apigatewayv2_integration" "api_integration_github_app_webhook_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the GitHub app webhook Lambda function"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_github_app_webhook.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_github_webhook_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"

  # Remove the following snippet once this PR is merged:
  # https://github.com/terraform-providers/terraform-provider-aws/pull/13062
  lifecycle {
    ignore_changes = [passthrough_behavior]
  }
}

resource "aws_apigatewayv2_integration" "api_integration_slack_authorize_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the Slack Authorize Lambda function"
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

resource "aws_apigatewayv2_integration" "api_integration_github_action_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the GitHub Action Lambda function"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_github_action.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_github_action_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"

  # Remove the following snippet once this PR is merged:
  # https://github.com/terraform-providers/terraform-provider-aws/pull/13062
  lifecycle {
    ignore_changes = [passthrough_behavior]
  }
}

resource "aws_apigatewayv2_route" "route_get_github_app_webhook" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "POST /github/webhook"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_github_app_webhook_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_get_slack_authorize" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "GET /slack/authorize"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_slack_authorize_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_post_action" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "POST /"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_github_action_lambda.id}"
}

module "api_gateway_stage_prod_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
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

module "api_gateway_domain_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["api-gateway", "custom-domain"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_api_gateway_domain_name" "api_streaming_slack_notify" {
  domain_name              = "api.${var.dns_zone_name}"
  regional_certificate_arn = aws_acm_certificate.api_gateway_custom_domain_cert.arn
  security_policy          = "TLS_1_2"

  endpoint_configuration {
    types = ["REGIONAL"]
  }

  tags = module.api_gateway_domain_label.tags
}

resource "aws_route53_record" "api_gateway_custom_domain_cname" {
  name    = "api.${var.dns_zone_name}"
  zone_id = data.aws_route53_zone.zone.id
  type    = "CNAME"
  records = [aws_api_gateway_domain_name.api_streaming_slack_notify.regional_domain_name]
  ttl     = 300
}

resource "aws_apigatewayv2_api_mapping" "api_gateway_prod_stage_mapping" {
  api_id      = aws_apigatewayv2_api.default.id
  stage       = aws_apigatewayv2_stage.stage_prod.id
  domain_name = aws_api_gateway_domain_name.api_streaming_slack_notify.domain_name
}

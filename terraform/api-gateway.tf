module "api_gateway_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["api"]
  tags       = local.tags
}

resource "aws_apigatewayv2_api" "default" {
  name          = module.api_gateway_label.id
  description   = "Endpoint for handling OAuth 2.0 Slack requests and initial GitHub action requests"
  protocol_type = "HTTP"
  tags          = module.api_gateway_label.tags
}

//
// Integrations
//

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
}

resource "aws_apigatewayv2_integration" "api_integration_slack_webhook_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the Slack Webhook Lambda function"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_slack_webhook.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_slack_webhook_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration" "api_integration_github_webhook_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the GitHub app webhook Lambda function"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_github_webhook.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_github_webhook_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"
}

resource "aws_apigatewayv2_integration" "api_integration_github_post_install_lambda" {
  api_id                 = aws_apigatewayv2_api.default.id
  integration_type       = "AWS_PROXY"
  connection_type        = "INTERNET"
  description            = "Proxies requests to the GitHub app post-install Lambda function"
  integration_method     = "POST"
  integration_uri        = aws_lambda_function.lambda_github_post_install.invoke_arn
  payload_format_version = "2.0"
  timeout_milliseconds   = (var.lambda_github_post_install_timeout * 1000) + 250
  passthrough_behavior   = "WHEN_NO_MATCH"
}


//
// Routes
//

resource "aws_apigatewayv2_route" "route_get_slack_authorize" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "GET /slack/authorize"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_slack_authorize_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_get_slack_webhook" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "POST /slack/webhook"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_slack_webhook_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_get_github_webhook" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "POST /github/webhook"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_github_webhook_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_get_github_post_install_get" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "GET /github/post-install"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_github_post_install_lambda.id}"
}

resource "aws_apigatewayv2_route" "route_get_github_post_install_post" {
  api_id             = aws_apigatewayv2_api.default.id
  route_key          = "POST /github/post-install"
  authorization_type = "NONE"
  target             = "integrations/${aws_apigatewayv2_integration.api_integration_github_post_install_lambda.id}"
}

//
// Stages
//

module "api_gateway_stage_prod_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["api", "gateway", "prod"]
  tags       = local.tags
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
}

//
// Custom Domain
//

module "api_gateway_domain_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["api-gateway", "custom-domain"]
  tags       = local.tags
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

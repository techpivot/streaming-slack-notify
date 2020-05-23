module "acm_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = var.name
  attributes         = ["acm", "certificate"]
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

resource "aws_acm_certificate" "api_gateway_custom_domain_cert" {
  domain_name = var.dns_zone_name
  subject_alternative_names = [
    "*.${var.dns_zone_name}"
  ]
  validation_method = "DNS"

  tags = module.acm_label.tags

  lifecycle {
    create_before_destroy = true
  }
}

data "aws_route53_zone" "zone" {
  name = var.dns_zone_name
}

resource "aws_route53_record" "cert_validation" {
  name    = aws_acm_certificate.api_gateway_custom_domain_cert.domain_validation_options.0.resource_record_name
  type    = aws_acm_certificate.api_gateway_custom_domain_cert.domain_validation_options.0.resource_record_type
  zone_id = data.aws_route53_zone.zone.id
  records = [aws_acm_certificate.api_gateway_custom_domain_cert.domain_validation_options.0.resource_record_value]
  ttl     = 60
}

resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.api_gateway_custom_domain_cert.arn
  validation_record_fqdns = [ aws_route53_record.cert_validation.fqdn ]
}

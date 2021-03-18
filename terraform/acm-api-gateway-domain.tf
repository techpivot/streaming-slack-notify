module "acm_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
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
  for_each = {
    for dvo in aws_acm_certificate.api_gateway_custom_domain_cert.domain_validation_options : dvo.domain_name => {
      name   = dvo.resource_record_name
      record = dvo.resource_record_value
      type   = dvo.resource_record_type
    }
  }

  allow_overwrite = true
  name            = each.value.name
  records         = [each.value.record]
  ttl             = 60
  type            = each.value.type
  zone_id         = data.aws_route53_zone.zone.id
}

resource "aws_acm_certificate_validation" "cert_validation" {
  certificate_arn         = aws_acm_certificate.api_gateway_custom_domain_cert.arn
  validation_record_fqdns = [for record in aws_route53_record.cert_validation : record.fqdn]
}

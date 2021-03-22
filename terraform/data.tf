# The Route53 hosted zone is created by master infra so we'll get the ID via data
data "aws_route53_zone" "zone" {
  name = var.dns_zone_name
}
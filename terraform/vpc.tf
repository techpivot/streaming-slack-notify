module "vpc_label" {
  source             = "cloudposse/label/null"
  version            = "0.24.1"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = "vpc"
  tags               = local.tags
  additional_tag_map = var.additional_tag_map
}

data "aws_availability_zones" "available" {
  state = "available"
}

locals {
  tags_without_name = {
    for key in keys(module.vpc_label.tags) :
    key => module.vpc_label.tags[key]
    if key != "Name"
  }
}

module "vpc" {
  source = "terraform-aws-modules/vpc/aws"

  name                  = module.vpc_label.id
  intra_subnet_suffix   = "intra"
  private_subnet_suffix = "private"
  public_subnet_suffix  = "public"

  cidr = local.cidr

  azs             = local.vpc_azs
  private_subnets = local.vpc_private_subnets
  public_subnets  = local.vpc_public_subnets

  enable_nat_gateway   = false
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.tags_without_name
}

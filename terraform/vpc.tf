
module "vpc_label" {
  source             = "git::https://github.com/cloudposse/terraform-null-label.git?ref=tags/0.16.0"
  namespace          = var.namespace
  environment        = var.environment
  stage              = var.stage
  name               = "vpc"
  delimiter          = var.delimiter
  attributes         = var.attributes
  tags               = var.tags
  additional_tag_map = var.additional_tag_map
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

  cidr = "10.0.0.0/16"

  azs             = ["us-west-2a", "us-west-2b", "us-west-2c", "us-west-2d"]
  private_subnets = ["10.0.1.0/24", "10.0.2.0/24", "10.0.3.0/24", "10.0.4.0/24"]
  public_subnets  = ["10.0.101.0/24", "10.0.102.0/24", "10.0.103.0/24", "10.0.104.0/24"]

  enable_nat_gateway   = false
  enable_vpn_gateway   = false
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = local.tags_without_name
}

locals {
  tags = {
    Terraform = true,
    Managed   = true
  }

  cidr = "10.0.0.0/16"

  vpc_azs = data.aws_availability_zones.available.names

  vpc_private_subnets = [
    for index, az in local.vpc_azs :
    cidrsubnet(local.cidr, 8, index)
  ]

  vpc_public_subnets = [
    for index, az in local.vpc_azs :
    cidrsubnet(local.cidr, 8, index + 100)
  ]

  public_vpc_subnet_ids = module.vpc.public_subnets
  public_vpc_subnet_ids_length = length(local.public_vpc_subnet_ids)
  ecs_instance_type_keys = keys(var.ecs_instance_types_with_max_price)
  ecs_instance_type_keys_length = length(local.ecs_instance_type_keys)
  ecs_launch_config_overrides = [
    for index in range(local.public_vpc_subnet_ids_length * local.ecs_instance_type_keys_length):
      {
        subnet_id     = local.public_vpc_subnet_ids[index % local.public_vpc_subnet_ids_length]
        instance_type = local.ecs_instance_type_keys[floor(index / local.public_vpc_subnet_ids_length)]
        spot_price    = var.ecs_instance_types_with_max_price[local.ecs_instance_type_keys[floor(index / local.public_vpc_subnet_ids_length)]]

      }
  ]
}

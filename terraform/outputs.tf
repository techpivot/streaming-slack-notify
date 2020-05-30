output "aws_amazon_linux_2_ecs_instance_id" {
  value = data.aws_ami.ecs.id
}

output "aws_ecr_repository_name" {
  value = aws_ecr_repository.default.name
}

output "vpc_public_subnets" {
  value = {
    for index, cidr in module.vpc.public_subnets_cidr_blocks :
    cidr => module.vpc.azs[index]
  }
}

output "api_gateway_endpoint" {
  value = aws_api_gateway_domain_name.api_streaming_slack_notify.domain_name
}

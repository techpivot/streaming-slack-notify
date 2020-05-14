output "aws_amazon_linux_2_ecs_instance_id" {
  value = data.aws_ami.ecs.id
}

output "aws_ecr_repository_name" {
  value = aws_ecr_repository.default.name
}


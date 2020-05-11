locals {
  tags = {
    Namespace = var.namespace,
    Terraform = true,
    Managed   = true
  }
}

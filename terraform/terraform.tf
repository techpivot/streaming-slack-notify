terraform {
  required_providers {
    aws = {
      source = "hashicorp/aws"
    }
    template = {
      source = "hashicorp/template"
    }
  }

  required_version = ">= 0.15"

  # State is currently managed by TechPivot shared-services DevOps team and provided here for this application
  backend "s3" {
    region         = "us-west-2"
    bucket         = "techpivot-shared-services-terraform-state"
    key            = "streaming-slack-notify/aws.tfstate"
    dynamodb_table = "techpivot-shared-services-terraform-state-lock"
    role_arn       = "arn:aws:iam::074245827515:role/techpivot-streaming-slack-notify-terraform-tfstate-mgmt"
    encrypt        = "true"
  }
}

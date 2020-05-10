terraform {
  required_version = ">= 0.12"

  backend "s3" {
    region         = "us-west-2"
    bucket         = "techpivot-streaming-slack-notify-terraform-state"
    key            = "terraform.tfstate"
    dynamodb_table = "techpivot-streaming-slack-notify-terraform-state-lock"
    profile        = ""
    role_arn       = ""
    encrypt        = "true"
  }
}

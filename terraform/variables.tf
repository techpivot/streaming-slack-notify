
variable "namespace" {
  type        = string
  description = "Namespace, which could be your organization name or abbreviation, e.g. 'eg' or 'cp'"
  default     = "techpivot-streaming-slack-notify"
}

# Note: We are currently using us-east-1 because
#  1) GitHub and Slack both have the lowest pings to their primary masters in this region
#  2) Largest AZ pool for optimum spot instances capacity + pricing
variable "region" {
  type        = string
  description = "The primary region for the organization and default regional resources"
  default     = "us-east-1"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Additional tags (e.g. `map('BusinessUnit','XYZ')`"
}

variable "dns_zone_name" {
  type        = string
  default     = "streaming-slack-notify.techpivot.com"
  description = "The name of the DNS zone name for this account has permissions to add records"
}

variable "dynamodb_slack_read_capacity" {
  default     = 2
  type        = number
  description = "DynamoDB slack table read capacity units"
}

variable "dynamodb_slack_write_capacity" {
  default     = 2
  type        = number
  description = "DynamoDB slack write capacity units"
}

variable "dynamodb_github_read_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB github table read capacity units"
}

variable "dynamodb_github_write_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB github write capacity units"
}

variable "dynamodb_stats_read_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB github table read capacity units"
}

variable "dynamodb_stats_write_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB github write capacity units"
}

variable "spot_fleet_target_capacity" {
  description = "Default target capacity for the spot fleet"
  type        = number
  default     = 1
}

# AMI: techpivot-amzn2-ami-ecs-hvm-2.0.20210514-arm64-ebs
variable "ecs_launch_template_ami_image_id" {
  description = "An explicit AMI image ID to be used. Typically, image is generated manually to reduce the 30GB default size volumes. If not specified, the latest 30GB image will be used"
  type        = string
  default     = "ami-0911760d5478462d3"
}

variable "ecs_instance_types_with_max_price" {
  description = "A map of allowed ECS instance types with corresponding max price"
  type        = map(any)
  # Note: When viewing the `Instance type(s)` in the AWS UI, it will round to 3 decimals so don't be alarmed
  # if it looks different in the UI from our specified prices below.
  default = {
    # Keep instances in same suite - e.g. AWS Graviton Instances as our launch config is using arm64 builds
    "t4g.nano" = 0.0013
  }
}

variable "lambda_runtime" {
  type        = string
  description = "The runtime to use for all Node lambda functions"
  default     = "nodejs14.x"
}

variable "lambda_slack_oauth_authorize_timeout" {
  type        = number
  description = "The number of seconds before the Lambda function times out (Needs to query Slack + DynamoDB)"
  default     = 15
}

variable "lambda_slack_webhook_timeout" {
  type        = number
  description = "The number of seconds before the Lambda webhook function times out (Needs to query DynamoDB)"
  default     = 5
}

variable "lambda_github_webhook_timeout" {
  type        = number
  description = "The number of seconds before the Lambda function times out (Needs to query DynamoDB)"
  default     = 10
}

variable "lambda_github_post_install_timeout" {
  type        = number
  description = "The number of seconds before the Lambda post-install function times out (Needs to query DynamoDB)"
  default     = 15
}

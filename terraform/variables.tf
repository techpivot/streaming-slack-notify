
variable "namespace" {
  type        = string
  description = "Namespace, which could be your organization name or abbreviation, e.g. 'eg' or 'cp'"
  default     = "techpivot"
}

# Note: We are currently using us-east-1 because
#  1) GitHub and Slack both have the lowest pings to their primary masters in this region
#  2) Largest AZ pool for optimum spot instances capacity + pricing
variable "region" {
  type        = string
  description = "The primary region for the organization and default regional resources"
  default     = "us-east-1"
}

variable "environment" {
  type        = string
  default     = ""
  description = "Environment, e.g. 'prod', 'staging', 'dev', 'pre-prod', 'UAT'"
}

variable "stage" {
  type        = string
  default     = ""
  description = "Stage, e.g. 'prod', 'staging', 'dev', OR 'source', 'build', 'test', 'deploy', 'release'"
}

variable "name" {
  type        = string
  default     = "streaming-slack-notify"
  description = "Solution name, e.g. 'app' or 'jenkins'"
}

variable "tags" {
  type        = map(string)
  default     = {}
  description = "Additional tags (e.g. `map('BusinessUnit','XYZ')`"
}

variable "additional_tag_map" {
  type        = map(string)
  default     = {}
  description = "Additional tags for appending to each tag map"
}

variable "dns_zone_name" {
  type        = string
  default     = "streaming-slack-notify.techpivot.com"
  description = "The name of the DNS zone name for this account has permissions to add records"
}

variable "dynamodb_read_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB read capacity units"
}

variable "dynamodb_write_capacity" {
  default     = 3
  type        = number
  description = "DynamoDB write capacity units"
}

variable "spot_fleet_target_capacity" {
  description = "Default target capacity for the spot fleet"
  type        = number
  default     = 1
}

variable "ecs_instance_types_with_max_price" {
  description = "A map of allowed ECS instance types with corresponding max price"
  type        = map
  default = {
    "t3a.nano" = 0.0017
    "t3.nano"  = 0.0016
  }
}

variable "ecs_asg_max_size" {
  type    = number
  default = 1
}

variable "ecs_asg_min_size" {
  type    = number
  default = 0
}

variable "ecs_asg_desired_capacity" {
  type    = number
  default = 0
}

variable "lambda_slack_oauth_authorize_timeout" {
  type        = number
  description = "The number of seconds before the Lambda function times out (Needs to query Slack + DynamoDB)"
  default     = 15
}

variable "lambda_github_action_timeout" {
  type        = number
  description = "The number of seconds before the Lambda function times out (Needs to query DynamoDB + SQS)"
  default     = 10
}

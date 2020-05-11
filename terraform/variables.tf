
variable "namespace" {
  type        = string
  description = "Namespace, which could be your organization name or abbreviation, e.g. 'eg' or 'cp'"
  default     = "techpivot"
}

variable "region" {
  type        = string
  description = "The primary region for the organization and default regional resources"
  default     = "us-west-2"
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

[
  {
    "name": "server",
    "image": "${repository}:latest",
    "essential": true,
    "portMappings": [],
    "environment": [
      {"name": "DEBUG", "value": "*" }
    ],
    "logConfiguration": {
      "logDriver": "awslogs",
      "options": {
        "awslogs-region": "${region}",
        "awslogs-group": "${logsGroup}",
        "awslogs-stream-prefix": "${streamPrefix}"
      }
    }
  }
]
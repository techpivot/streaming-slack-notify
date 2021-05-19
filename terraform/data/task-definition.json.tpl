[
  {
    "name": "server",
    "image": "${repository}:latest",
    "networkMode": "awsvpc",
    "essential": true,
    "portMappings": [],
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
[
  {
    "name": "server",
    "image": "nginx",
    "cpu": 0,
    "memory": 458,
    "networkMode": "awsvpc",
    "essential": true,
    "portMappings": [
      {
        "containerPort": 80,
        "hostPort": 80,
        "protocol": "tcp"
      }
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
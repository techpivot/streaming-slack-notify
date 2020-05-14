[
  {
    "name": "streaming-slack-notify",
    "image": "nginx",
    "cpu": 0,
    "memory": 461,
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
        "awslogs-region": "us-west-2",
        "awslogs-group": "hello_world",
        "awslogs-stream-prefix": "complete-ecs"
      }
    }
  }
]
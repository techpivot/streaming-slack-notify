#!/bin/bash

# Reference: ECS Draining
# https://docs.aws.amazon.com/AmazonECS/latest/developerguide/container-instance-spot.html

# ECS
cat <<'EOF' >> /etc/ecs/ecs.config
ECS_CLUSTER=${aws_ecs_cluster}
ECS_ENABLE_SPOT_INSTANCE_DRAINING=true
ECS_ENABLE_TASK_IAM_ROLE=true
EOF

# Configure small swap just in case
fallocate -l 256M /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

#!/bin/bash

# ECS
cat <<'EOF' >> /etc/ecs/ecs.config
ECS_CLUSTER=${aws_ecs_cluster}
ECS_ENABLE_SPOT_INSTANCE_DRAINING=true
EOF

# Configure small swap just in case
fallocate -l 256M /swapfile
chmod 600 /swapfile
mkswap /swapfile
swapon /swapfile
echo "/swapfile swap swap defaults 0 0" >> /etc/fstab

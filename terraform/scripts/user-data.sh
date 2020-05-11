#!/bin/bash
cat <<'EOF' >> /etc/ecs/ecs.config
ECS_CLUSTER=${aws_ecs_cluster}
ECS_ENABLE_SPOT_INSTANCE_DRAINING=true
EOF

systemctl restart ecs

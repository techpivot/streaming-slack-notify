# In order to reduce cost, we reduce the size of the 30GB ECS instances. In order to do this:

/**

1. Create a new temporary t4g instance
    a. AWS > EC2 > Launch Templates
    b. Select: techpivot-streaming-slack-notify-launch-template-ebs-resizer
    c. Ensure latest version is selected.
    d. Subnet: Select us-east-1a/b/c/d/f
    e. Security Select techpivot-streaming-slack-notify-sg-ecs-instance
    f. Click: Launch instance from template

2. Create a new 4GB Volume and attach
    a. AWS > EC2 > Volumes > Create Volume
    b. Size: 4GB
    c. Ensure the availability zone matches the zone of the instance and volume in previous steps.
    d. Attach volume to instance

3. Create a new volume from the snapshot associated with the AMI.
    a. Find the AMI used: AWS > EC2 > AMIs
    b. Filter by the AMI used.
    c. In the Block devices section, pull out the `snap-XXXXXXXXXXXXXXX`
    d. AWS > EC2 > Snapshots > Filter on `snap-XXXXXXXXXXXXXX`
    e. Select the snapshot. Click Actions > Create Volume
    f. Attach the volume to instance

At this point we should have 3 disks. We will copy everything from the /dev/nvme2 into /dev/nvme1 since
the snapshot mounted volume is more consistent in terms of non-root/active files so it's better to use this
instead of /dev/nvme0.

  > lsblk -f

  NAME          FSTYPE LABEL UUID                                 MOUNTPOINT
  nvme0n1
  ├─nvme0n1p1   ext4   /     64032d13-7b1f-40b5-bc08-4804b246f734 /
  └─nvme0n1p128 vfat         CD22-77D2                            /boot/efi
  nvme1n1
  nvme2n1
  ├─nvme2n1p1   ext4   /     64032d13-7b1f-40b5-bc08-4804b246f734 /snap-p1
  └─nvme2n1p128 vfat         CD22-77D2                            /snap-p128

4. Mount the primary cloned snapshot

  mkdir -p /snap-p1
  mkdir -p /snap-p128
  mount /dev/nvme2n1p1 /snap-p1
  mount /dev/nvme2n1p128 /snap-p128

5. Install tools

  yum install -y parted rsync

6. Create partitions

  parted /dev/nvme1n1
    mklabel GPT
    Yes

  gdisk /dev/nvme1n1
    n
    128
    2048
    22527
    EF00
    n
    1
    [ENTER]
    [ENTER]
    [ENTER]
    w
    Yes

7. Create new file system mount points

  mkdir -p /mnt/new-volume-p1
  mkdir -p /mnt/new-volume-p128
  mkfs -t ext4 /dev/nvme1n1p1
  mkfs -t vfat -i CD2277D2 /dev/nvme1n1p128
  tune2fs -U 64032d13-7b1f-40b5-bc08-4804b246f734 /dev/nvme1n1p1
  tune2fs -U CD22-77D2 /dev/nvme1n1p128
  mount /dev/nvme1n1p1 /mnt/new-volume-p1
  mount /dev/nvme1n1p128 /mnt/new-volume-p128

8. Rsync

 rsync -axv /snap-p1/ /mnt/new-volume-p1
 rsync -axv /snap-p128/ /mnt/new-volume-p128

9. Update Disk Label

  e2label /dev/nvme1n1p1 /

10. Update serial for primary (boot disk label already set)

  tune2fs -U 64032d13-7b1f-40b5-bc08-4804b246f734 /dev/nvme1n1p1

11. Confirm:

  lsblk -f

12. Unmount

  umount /mnt/new-volume-p1
  umount /mnt/new-volume-p128

13. Take AWS Snapshot

  AWS > Volumes > Snapshot

14. Create image from snapshot

*/

module "launch_template_ebs_resizer_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  name       = "launch-template"
  attributes = ["ebs", "resizer"]
  tags       = local.tags
}

resource "aws_launch_template" "ebs_resizer" {
  name = module.launch_template_ebs_resizer_label.id

  capacity_reservation_specification {
    capacity_reservation_preference = "open"
  }

  iam_instance_profile {
    name = aws_iam_instance_profile.ecs_iam_instance_profile.name
  }

  disable_api_termination              = false
  ebs_optimized                        = true
  instance_initiated_shutdown_behavior = "stop"
  image_id                             = data.aws_ami.ecs.id
  vpc_security_group_ids               = [aws_security_group.ecs_instance.id]
  key_name                             = aws_key_pair.default.key_name
  instance_type                        = element(keys(var.ecs_instance_types_with_max_price), 0)

  monitoring {
    # No need for deteailed monitoring. This also costs extra.
    enabled = false
  }
}

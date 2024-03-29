module "keypair_label" {
  source     = "cloudposse/label/null"
  version    = "0.24.1"
  namespace  = var.namespace
  attributes = ["ecs"]
  tags       = local.tags
}

resource "aws_key_pair" "default" {
  key_name   = module.keypair_label.id
  public_key = "ssh-rsa AAAAB3NzaC1yc2EAAAADAQABAAACAQCrxIWB+sA+mpVPmu+m39Byt7YdN0OUOw5ndbItW38UFGXQpz3qMnEwwbT31UuieL802B5YR/FyAs6KzAU1xoSof0uMmTg5Nw38oVHWntZdEncqv04AbXmbtWIFj+2C4xRb+SyFVp6VWJA6qMP49kqrNga7526sepik6CZuri9eiXUfkP2xny4/+34OpBlpfg29x7+ydh8QRmKxQTCVUPXOFaPOhYQPZxW/mJLIAA+EWl04A1d+2EhnUFZfsdPNAQf0NamKCP+dXW8+Kuk7iqjCGhDbj1y+5LKx3mkJkcIexV4BagQn56qlaJ3FfyFIoCv+CbJZKrYL9b49PLEt1/cRH+cuKSRulWzRr2HzICKVUOTqCvx8/1r8s/I/uAP/W1aeSCI1tKGzlexSXKUp8XhEBsc/wXi8vRauJe1HPJ6dknifOukn7AiWkwn2/09Wk8BuCS+lMjpUSoKxziaa85E9GZkKNR43oshCYUQSQGDsssSajIgGsi9NE3mNrgNXuIuwV42fw4zQYN27dtiyd5Uig+RS/DGypPTSK3e3N6lMrqG4wvI1UlceFKF5cW5AMRqA32FhD5a/bFvd5rbQSxFfheeXYBoK5BaAtxAiWDOScNdkAzfyKRiTH6/gIohgskAl91MoxpaKgMliHtIEsZffS0JKzkCJQA8BwhJr3X3E4w=="
}
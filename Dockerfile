FROM node:12

ARG DEBIAN_FRONTEND=noninteractive

RUN apt-get update \
  && apt-get upgrade -y \
  && yarn install \
  && apt-get clean autoclean \
  && apt-get autoremove --yes \
  && rm -rf /var/lib/{apt,dpkg,cache,log}/

WORKDIR /app
VOLUME  /app

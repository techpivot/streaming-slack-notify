ARG DOCKER_REPO=node
ARG NODE_VERSION=14

FROM ${DOCKER_REPO}:${NODE_VERSION}

COPY ./packages/server/dist /app

WORKDIR /app

CMD ["node", "/app/index.js"]

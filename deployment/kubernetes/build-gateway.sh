#!/bin/bash

###########################################################
# Build the API gateway and its plugins into a Docker image
###########################################################

#
# Ensure that we are in the root folder
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Use a timestamp based tag and support both KIND and DockerHub repositories
#
TAG=$(date +%Y%m%d%H%M%S)
echo $TAG > ./gatewaydockertag.txt
if [ "$DOCKER_REPOSITORY" == "" ]; then
  DOCKER_IMAGE="apigateway:$TAG"
else
  DOCKER_IMAGE="$DOCKER_REPOSITORY/apigateway:$TAG"
fi

#
# Build the custom API gateway docker container
#
cd ../..
docker build --no-cache -f deployment/kubernetes/apigateway/Dockerfile -t "$DOCKER_IMAGE" .
if [ $? -ne 0 ]; then
  echo '*** API gateway docker build problem encountered'
  exit 1
fi

#
# Push the Docker image for the API gateway
#
if [ "$DOCKER_REPOSITORY" == "" ]; then
  kind load docker-image "$DOCKER_IMAGE" --name oauth
else
  docker image push "$DOCKER_IMAGE"
fi
if [ $? -ne 0 ]; then
  echo '*** API gateway docker push problem encountered'
  exit 1
fi

#!/bin/bash

##################################################
# Build the OAuth Agent's code into a Docker image
##################################################

#
# Ensure that we are in the root folder
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Use a timestamp based tag and support both KIND and DockerHub repositories
#
TAG=$(date +%Y%m%d%H%M%S)
echo $TAG > ./oauthagentdockertag.txt
if [ "$DOCKER_REPOSITORY" == "" ]; then
  DOCKER_IMAGE="oauthagent:$TAG"
else
  DOCKER_IMAGE="$DOCKER_REPOSITORY/oauthagent:$TAG"
fi

#
# Build the OAuth Agent code
#
cd ../..
npm install
npm run buildRelease
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent build problem encountered'
  exit 1
fi

#
# Build its Docker container
#
docker build --no-cache -f deployment/kubernetes/oauthagent/Dockerfile -t "$DOCKER_IMAGE" .
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent docker build problem encountered'
  exit 1
fi

#
# Push the Docker image for the OAuth agent
#
if [ "$DOCKER_REPOSITORY" == "" ]; then
  kind load docker-image "$DOCKER_IMAGE" --name oauth
else
  docker image push "$DOCKER_IMAGE"
fi
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent docker push problem encountered'
  exit 1
fi

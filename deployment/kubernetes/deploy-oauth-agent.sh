
#!/bin/bash

########################################=#############
# Deploy OAuth agent resources to a Kubernetes cluster
######################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Check prerequisites
#
if [ "$ENVIRONMENT_FOLDER" == "" ]; then
  echo '*** Environment variables neeed by the deploy-oauth-agent script have not been supplied'
  exit 1
fi

#
# Use a timestamp based tag and support both KIND and DockerHub repositories
#
TAG=$(cat ./oauthagentdockertag.txt)
if [ "$DOCKER_REPOSITORY" == "" ]; then
  export DOCKER_IMAGE="oauthagent:$TAG"
else
  export DOCKER_IMAGE="$DOCKER_REPOSITORY/oauthagent:$TAG"
fi

#
# Create a new cookie encryption key and apply other environment variables
#
export COOKIE_ENCRYPTION_KEY=$(cat ./cookie-encryption.key)
. ../environments/$ENVIRONMENT_FOLDER/oauthagent.env

#
# Produce the final component YAML with the correct Docker images and environment variables
#
envsubst < ./oauthagent/template.yaml > ./oauthagent/oauthagent.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running envsubst to produce the final OAuth Agent YAML file'
  exit 1
fi

#
# Deploy the OAuth Agent to the Kubernetes cluster
#
kubectl -n applications delete -f ./oauthagent/oauthagent.yaml 2>/dev/null
kubectl -n applications apply  -f ./oauthagent/oauthagent.yaml
if [ $? -ne 0 ]; then
  echo '*** OAuth Agent Kubernetes deployment problem encountered'
  exit 1
fi

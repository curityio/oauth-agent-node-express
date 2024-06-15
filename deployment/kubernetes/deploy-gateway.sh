
#!/bin/bash

######################################################
# Deploy API gateway resources to a Kubernetes cluster
######################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Check prerequisites
#
if [ "$ENVIRONMENT_FOLDER" == "" ]; then
  echo '*** Environment variables neeed by the deploy-gateway script have not been supplied'
  exit 1
fi

#
# Use a timestamp based tag and support both KIND and DockerHub repositories
#
TAG=$(cat ./gatewaydockertag.txt)
if [ "$DOCKER_REPOSITORY" == "" ]; then
  export DOCKER_IMAGE="apigateway:$TAG"
else
  export DOCKER_IMAGE="$DOCKER_REPOSITORY/apigateway:$TAG"
fi

#
# Create the gateway namespace
#
kubectl delete namespace kong 2>/dev/null
kubectl create namespace kong
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the tokenhandler namespace'
  exit 1
fi

#
# Enable sidecar injection for all kong components
#
kubectl label namespace kong istio-injection=enabled --overwrite
if [ $? -ne 0 ]; then
  echo '*** Problem encountered enabling sidecar injection for the gateway namespace'
  exit 1
fi

#
# Read the cookie encryption key
#
export COOKIE_ENCRYPTION_KEY=$(cat ./cookie-encryption.key)

#
# Update gateway routes configuration
#
envsubst < ../environments/$ENVIRONMENT_FOLDER/gateway-routes-template.yml > ../environments/$ENVIRONMENT_FOLDER/gateway-routes.yml
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the envsubst tool to update gateway configuration'
  exit 1
fi

#
# Create a configmap for the API gateway
#
kubectl -n kong delete configmap gateway-routes-config 2>/dev/null
kubectl -n kong create configmap gateway-routes-config --from-file="kong.yml=../environments/$ENVIRONMENT_FOLDER/gateway-routes.yml"
if [ $? -ne 0 ]; then
  echo '*** Problem encountered creating the API gateway configmap'
  exit 1
fi

#
# Produce the final component YAML
#
envsubst < ./apigateway/template.yaml > ./apigateway/gateway.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered running envsubst to produce the final gateway YAML file'
  exit 1
fi

#
# Deploy the API gateway to the Kubernetes cluster
#
kubectl -n kong delete -f ./apigateway/gateway.yaml 2>/dev/null
kubectl -n kong apply  -f ./apigateway/gateway.yaml
if [ $? -ne 0 ]; then
  echo '*** Problem encountered deploying the API gateway'
  exit 1
fi

#!/bin/bash

##############################################################
# Deploy the Curity Identity Server with the required settings
# This enables the OAuth Agent to be tested in isolation 
##############################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# This is for Curity developers only
#
cp ./pre-commit ../../../.git/hooks

#
# Check for a license file
#
if [ ! -f './license.json' ]; then
  echo "Please provide a license.json file in the test/end-to-end/idsvr folder"
  exit 1
fi

#
# Run Docker to deploy the Curity Identity Server
#
docker compose --project-name oauthagent up --force-recreate
if [ $? -ne 0 ]; then
  echo "Problem encountered starting Docker components"
  exit 1
fi


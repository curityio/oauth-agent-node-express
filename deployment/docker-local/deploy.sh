#!/bin/bash

##############################################################
# A script to test Docker deployment on a development computer
##############################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Run the docker deployment
#
docker compose --project-name tokenhandler up --force-recreate --detach
if [ $? -ne 0 ]; then
  echo 'Problem encountered running the Docker deployment'
  exit 1
fi

#
# Wait for the OAuth Agent to become available, indicating that the gateway is also working
#
echo 'Waiting for OAuth agent endpoints to become available ...'
WEB_ORIGIN='https://www.authsamples-dev.com'
BASE_URL='https://bfflocal.authsamples-dev.com:444'
while [ "$(curl -k -s -X POST \
                -H "origin:$WEB_ORIGIN" \
                -H 'token-handler-version: 1' \
                -o /dev/null \
                -w ''%{http_code}'' \
                "$BASE_URL/oauth-agent/login/start")" != '200' ]; do
  sleep 2
done

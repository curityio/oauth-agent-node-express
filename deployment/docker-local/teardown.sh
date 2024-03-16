#!/bin/bash

###################################################
# A script to tear down the local Docker deployment
###################################################

cd "$(dirname "${BASH_SOURCE[0]}")"
cd ..

#
# Run the docker deployment
#
echo 'Freeing token handler docker resources ...'
docker compose --project-name tokenhandler down

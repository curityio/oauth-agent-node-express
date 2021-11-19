#!/bin/bash

#########################################################################
# A simple script to free Docker resources when finished with development
#########################################################################

#
# Ensure that we are in the folder containing this script
#
cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Free the Docker resources
#
docker compose --project-name tokenhandler down

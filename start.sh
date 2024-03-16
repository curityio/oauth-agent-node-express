#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Set environment variables
#
. ./deployment/environments/dev/.env

#
# Then run the OAuth agent
#
node --loader ts-node/esm --no-warnings src/server.ts
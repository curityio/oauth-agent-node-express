#!/bin/bash

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Set environment variables
#
. ./deployment/environments/dev/oauthagent.env

#
# Install dependencies
#
if [ ! -d 'node_modules' ]; then
  npm install
  if [ $? -ne 0 ]; then
    echo 'Problem encountered installing dependencies'
    read -n 1
    exit 1
  fi
fi

#
# Also download certificates for local development
#
./downloadcerts.sh
if [ $? -ne 0 ]; then
  echo 'Problem encountered downloading certificates'
  read -n 1
  exit 1
fi

#
# Then run the OAuth agent
#
npx tsx src/server.ts

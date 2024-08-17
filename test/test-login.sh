#!/bin/bash

##########################################################
# Shared scripting to automate a code flow for AWS Cognito
##########################################################

cd "$(dirname "${BASH_SOURCE[0]}")"

#
# Get a header value from the HTTP response file
#
function getHeaderValue(){
  local _HEADER_NAME=$1
  local _HEADER_VALUE=$(cat $RESPONSE_FILE | grep -i "^$_HEADER_NAME" | sed -r "s/^$_HEADER_NAME: (.*)$/\1/i")
  local _HEADER_VALUE=${_HEADER_VALUE%$'\r'}
  echo $_HEADER_VALUE
}

#
# Get a cookie value in a similar way
#
function getCookieValue(){
  local _COOKIE_NAME=$1
  local _COOKIE_VALUE=$(cat $RESPONSE_FILE | grep -i "set-cookie: $_COOKIE_NAME" | sed -r "s/^set-cookie: $_COOKIE_NAME=(.[^;]*)(.*)$/\1/i")
  local _COOKIE_VALUE=${_COOKIE_VALUE%$'\r'}
  echo $_COOKIE_VALUE
}

#
# Test sending a valid start login request to the API
#
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H 'token-handler-version: 1' \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Start login failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq

#
# Follow redirects and post test credentials, then reget cookies
#
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
AUTHORIZATION_REQUEST_URL=$(jq -r .authorizationRequestUrl <<< "$JSON")

HTTP_STATUS=$(curl -i -L -s -k -X GET "$AUTHORIZATION_REQUEST_URL" \
-c $LOGIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered during an OpenID Connect authorization redirect, status: $HTTP_STATUS"
  exit 1
fi

LOGIN_POST_LOCATION=$(getHeaderValue 'location')
COGNITO_XSRF_TOKEN=$(getCookieValue 'XSRF-TOKEN' | cut -d ' ' -f 2)

HTTP_STATUS=$(curl -i -s -k -X POST "$LOGIN_POST_LOCATION" \
-H 'Content-Type: application/x-www-form-urlencoded' \
-b $LOGIN_COOKIES_FILE \
-c $LOGIN_COOKIES_FILE \
--data-urlencode "_csrf=$COGNITO_XSRF_TOKEN" \
--data-urlencode "username=$TEST_USERNAME" \
--data-urlencode "password=$TEST_PASSWORD" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '302' ]; then
  echo "*** Problem encountered submitting test user credentials, status: $HTTP_STATUS"
  exit 1
fi

#
# End the login by sending the response with the authorization code to the OAuth agent
#
APP_URL=$(getHeaderValue 'location')
if [ "$APP_URL" == '' ]; then
  echo '*** API driven login did not complete successfully'
  exit 1
fi
PAGE_URL_JSON='{"pageUrl":"'$APP_URL'"}'
echo $PAGE_URL_JSON | jq

HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H 'token-handler-version: 1' \
-c $MAIN_COOKIES_FILE \
-b $MAIN_COOKIES_FILE \
-d $PAGE_URL_JSON \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Problem encountered ending the login, status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit 1 
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
IS_LOGGED_IN=$(jq -r .isLoggedIn <<< "$JSON")
HANDLED=$(jq -r .handled <<< "$JSON")
if [ "$IS_LOGGED_IN" != 'true'  ] || [ "$HANDLED" != 'true' ]; then
   echo '*** End login returned an unexpected payload'
   exit 1
fi

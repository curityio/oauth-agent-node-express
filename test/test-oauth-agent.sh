#!/bin/bash

################################################################
# Tests to run against OAuth Agent endpoints outside the browser
################################################################

OAUTH_AGENT_BASE_URL='https://apilocal.authsamples-dev.com:444/oauth-agent'
WEB_BASE_URL='https://web.authsamples-dev.com'
RESPONSE_FILE=data/response.txt
MAIN_COOKIES_FILE=data/main_cookies.txt
LOGIN_COOKIES_FILE=data/login_cookies.txt
AUTHORIZATION_SERVER_BASE_URL='https://login.authsamples.com'
TEST_USERNAME=guestuser@mycompany.com
TEST_PASSWORD=GuestPassword1
export CURL_CA_BUNDLE='../certs/authsamples-dev.ca.pem'
#export http_proxy='http://127.0.0.1:8888'

#
# Initialization
#
cd "$(dirname "${BASH_SOURCE[0]}")"
mkdir -p data

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
# Test sending an invalid web origin to the OAuth Agent in an OPTIONS request
# The logic around CORS is configured, not coded, so ensure that it works as expected
#
echo '1. Testing OPTIONS request with an invalid web origin ...'
HTTP_STATUS=$(curl -i -s -X OPTIONS "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: http://malicious-site.com" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" == '000' ]; then
  echo '*** Connectivity problem encountered, please check endpoints and whether an HTTP proxy tool is running'
  exit
fi
ORIGIN=$(getHeaderValue 'Access-Control-Allow-Origin')
if [ "$ORIGIN" != '' ]; then
  echo '*** CORS access was granted to a malicious origin'
  exit
fi
echo '1. OPTIONS with invalid web origin was not granted access'

#
# Test sending a valid web origin to the OAuth Agent in an OPTIONS request
#
echo '2. Testing OPTIONS request with a valid web origin ...'
HTTP_STATUS=$(curl -i -s -X OPTIONS "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200'  ] && [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Problem encountered requesting cross origin access, status: $HTTP_STATUS"
  exit
fi
ORIGIN=$(getHeaderValue 'Access-Control-Allow-Origin')
if [ "$ORIGIN" != "$WEB_BASE_URL" ]; then
  echo '*** The Access-Control-Allow-Origin response header has an unexpected value'
  exit
fi
echo '2. OPTIONS with valid web origin granted access successfully'

#
# Next we will test an unauthenticated page load but first test CORS
# The logic around trusted origins is coded by us
#
echo '3. Testing end login POST with invalid web origin ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** End login did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** End login returned an unexpected error code"
   exit
fi
echo '3. POST to endLogin with an invalid web origin was successfully rejected'

#
# Test sending an end login request to the API as part of an unauthenticated page load
#
echo '4. Testing end login POST for an unauthenticated page load ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then \
  echo "*** Unauthenticated page load failed with status $HTTP_STATUS"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
IS_LOGGED_IN=$(jq -r .isLoggedIn <<< "$JSON")
HANDLED=$(jq -r .handled <<< "$JSON")
if [ "$IS_LOGGED_IN" != 'false'  ] || [ "$HANDLED" != 'false' ]; then
   echo "*** End login returned an unexpected payload"
   exit
fi
echo '4. POST to endLogin for an unauthenticated page load completed successfully'

#
# Test sending a start login request to the API with an invalid origin header
# The logic around trusted origins is coded by us
#
echo '5. Testing POST to start login from invalid web origin ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Start Login with an invalid web origin did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Start login returned an unexpected error code"
   exit
fi
echo '5. POST to startLogin with invalid web origin was not granted access'

#
# Test sending a valid start login request to the API
#
echo '6. Testing POST to start login ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Start login failed with status $HTTP_STATUS"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
echo "6. POST to start login succeeded and returned the authorization request URL"

#
# Follow redirects and post test credentials, then reget cookies
#
echo '7. Testing user authentication ...'
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
AUTHORIZATION_REQUEST_URL=$(jq -r .authorizationRequestUrl <<< "$JSON")
echo $AUTHORIZATION_REQUEST_URL

HTTP_STATUS=$(curl -i -L -s -X GET "$AUTHORIZATION_REQUEST_URL" \
-c $LOGIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '200' ]; then
  echo "*** Problem encountered during an OpenID Connect authorization redirect, status: $HTTP_STATUS"
  exit 1
fi

LOGIN_POST_LOCATION=$(getHeaderValue 'location')
COGNITO_XSRF_TOKEN=$(getCookieValue 'XSRF-TOKEN' | cut -d ' ' -f 2)

HTTP_STATUS=$(curl -k -i -s -X POST "$LOGIN_POST_LOCATION" \
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
echo '7. User authentications succeeded'

#
# End the login by sending the response with the authorization code to the OAuth agent
#
echo '8. Testing POST to end login ...'
APP_URL=$(getHeaderValue 'location')
if [ "$APP_URL" == '' ]; then
  echo '*** API driven login did not complete successfully'
  exit 1
fi
PAGE_URL_JSON='{"pageUrl":"'$APP_URL'"}'
echo $PAGE_URL_JSON | jq

HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
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
echo "8. POST to end login succeeded and issued cookies"

#
# Next verify that the OAuth state is correctly verified against the request value
#
echo '9. Testing posting a malicious code and state into the browser ...'
APP_URL="$WEB_BASE_URL?code=hi0f1340y843thy3480&state=nu2febouwefbjfewbj"
PAGE_URL_JSON='{"pageUrl":"'$APP_URL'"}'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-d $PAGE_URL_JSON \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '400' ]; then
  echo "*** Posting a malicious code and state into the browser did not fail as expected"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'invalid_request' ]; then
   echo "*** End login returned an unexpected error code"
   exit
fi
echo '9. Posting a malicious code and state into the browser was handled correctly'

#
# Test an authenticated page load by sending up the main cookies
#
echo '10. Testing an authenticated page load ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Authenticated page load failed with status $HTTP_STATUS"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CSRF=$(jq -r .csrf <<< "$JSON")
IS_LOGGED_IN=$(jq -r .isLoggedIn <<< "$JSON")
HANDLED=$(jq -r .handled <<< "$JSON")
if [ "$IS_LOGGED_IN" != 'true'  ] || [ "$HANDLED" != 'false' ]; then
   echo "*** End login returned an unexpected payload"
   exit
fi
echo '10. Authenticated page reload was successful'

#
# Test getting user info with an invalid origin
#
echo '11. Testing GET User Info from an untrusted origin ...'
HTTP_STATUS=$(curl -i -s -X GET "$OAUTH_AGENT_BASE_URL/userInfo" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid user info request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** User Info returned an unexpected error code"
   exit
fi
echo '11. GET User Info request for an untrusted origin was handled correctly'

#
# Test getting user info without a cookie
#
echo '12. Testing GET User Info without secure cookies ...'
HTTP_STATUS=$(curl -i -s -X GET "$OAUTH_AGENT_BASE_URL/userInfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid user info request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** User Info returned an unexpected error code"
   exit
fi
echo '12. GET User Info request without secure cookies was handled correctly'

#
# Test getting user info successfully
#
echo '13. Testing GET User Info with secure cookies ...'
HTTP_STATUS=$(curl -i -s -X GET "$OAUTH_AGENT_BASE_URL/userInfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Getting user info failed with status $HTTP_STATUS"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "13. GET User Info was successful"

#
# Test getting ID token claims without a cookie
#
echo '14. Testing GET claims without secure cookies ...'
HTTP_STATUS=$(curl -i -s -X GET "$OAUTH_AGENT_BASE_URL/claims" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid user info request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** User Info returned an unexpected error code"
   exit
fi
echo '14. GET claims request without secure cookies was handled correctly'

#
# Test getting ID token claims successfully
#
echo '15. Testing GET claims with secure cookies ...'
HTTP_STATUS=$(curl -i -s -X GET "$OAUTH_AGENT_BASE_URL/claims" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Getting claims failed with status $HTTP_STATUS"
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "15. GET claims request was successful"

#
# Test refreshing a token with an invalid origin
#
echo '16. Testing POST to /refresh from an untrusted origin ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit
fi
echo '16. POST to /refresh for an untrusted origin was handled correctly'

#
# Test refreshing a token without a cookie
#
echo '17. Testing POST to /refresh without secure cookies ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit
fi
echo '17. POST to /refresh without secure cookies was handled correctly'

#
# Test refreshing a token with secure cookies but with a missing anti forgery token
#
echo '18. Testing POST to /refresh without CSRF token ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit
fi
echo '18. POST to /refresh without CSRF token was handled correctly'

#
# Test refreshing a token with secure cookies but with an incorrect anti forgery token
#
echo '19. Testing POST to /refresh with incorrect CSRF token ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H 'x-mycompany-csrf: abc123' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit
fi
echo '19. POST to /refresh with incorrect CSRF token was handled correctly'

#
# Test refreshing a token, which will rewrite up to 3 cookies
#
echo '20. Testing POST to /refresh with correct secure details ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-mycompany-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit
fi
echo '20. POST to /refresh with correct secure details completed successfully'

#
# Test refreshing a token again, to ensure that the new refresh token is used for the refresh
#
echo '21. Testing POST to /refresh with rotated refresh token ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-mycompany-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit
fi
echo '21. POST to /refresh with rotated refresh token completed successfully'

#
# Test logging out with an invalid origin
#
echo '22. Testing logout POST with invalid web origin ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit
fi
echo '22. POST to logout with an invalid web origin was successfully rejected'

#
# Test logging out without a cookie
#
echo '23. Testing logout POST without secure cookies ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit
fi
echo '23. POST to logout without secure cookies was successfully rejected'

#
# Test logging out without an incorrect anti forgery token
#
echo '24. Testing logout POST with incorrect anti forgery token ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-mycompany-csrf: abc123" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit
fi
echo '24. POST to logout with incorrect anti forgery token was successfully rejected'

#
# Test getting the logout URL and clearing cookies successfully
#
echo '25. Testing logout POST with correct secure details ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-mycompany-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Logout request failed with status $HTTP_STATUS"
  exit
fi
echo '25. POST to logout with correct secure details completed successfully'
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq

#
# Test following the end session redirect to sign out in the Curity Identity Server
#
echo '26. Testing following the end session redirect redirect ...'
END_SESSION_REQUEST_URL=$(jq -r .url <<< "$JSON")
HTTP_STATUS=$(curl -i -s -X GET $END_SESSION_REQUEST_URL \
-c $LOGIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '302' ]; then
  echo "*** Problem encountered during an OpenID Connect end session redirect, status: $HTTP_STATUS"
  exit
fi
echo '26. End session redirect completed successfully'

#
# Test sending malformed JSON which currently results in a 500 error
#
echo '27. Testing sending malformed JSON to the OAuth Agent ...'
HTTP_STATUS=$(curl -i -s -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d 'XXX' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '500' ]; then
  echo '*** Posting malformed JSON did not fail as expected'
  exit
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'server_error' ]; then
   echo '*** Malformed JSON post returned an unexpected error code'
   exit
fi
echo '27. Malformed JSON was handled in the expected manner'

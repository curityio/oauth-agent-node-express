#!/bin/bash

################################################################
# Tests to run against OAuth Agent endpoints outside the browser
################################################################

export OAUTH_AGENT_BASE_URL='https://bff.authsamples-dev.com:444/oauth-agent'
export WEB_BASE_URL='https://www.authsamples-dev.com'
export RESPONSE_FILE=data/response.txt
export MAIN_COOKIES_FILE=data/main_cookies.txt
export LOGIN_COOKIES_FILE=data/login_cookies.txt
export COOKIE_PREFIX=mycompany
export AUTHORIZATION_SERVER_BASE_URL='https://login.authsamples.com'
export TEST_USERNAME=guestuser@mycompany.com
export TEST_PASSWORD=GuestPassword1
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
# Test sending an invalid web origin to the OAuth Agent in an OPTIONS request
# The logic around CORS is configured, not coded, so ensure that it works as expected
#
echo '1. Testing OPTIONS request with an invalid web origin ...'
HTTP_STATUS=$(curl -i -s -k -X OPTIONS "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: http://malicious-site.com" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" == '000' ]; then
  echo '*** Connectivity problem encountered'
  exit 1
fi
ORIGIN=$(getHeaderValue 'Access-Control-Allow-Origin')
if [ "$ORIGIN" != '' ]; then
  echo '*** CORS access was granted to a malicious origin'
  exit 1
fi
echo '1. OPTIONS with invalid web origin was not granted access'

#
# Test sending a valid web origin to the OAuth Agent in an OPTIONS request
#
echo '2. Testing OPTIONS request with a valid web origin ...'
HTTP_STATUS=$(curl -i -s -k -X OPTIONS "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: $WEB_BASE_URL" \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200'  ] && [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Problem encountered requesting cross origin access, status: $HTTP_STATUS"
  exit 1
fi
ORIGIN=$(getHeaderValue 'Access-Control-Allow-Origin')
if [ "$ORIGIN" != "$WEB_BASE_URL" ]; then
  echo '*** The Access-Control-Allow-Origin response header has an unexpected value'
  exit 1
fi
echo '2. OPTIONS with valid web origin granted access successfully'

#
# Next we will test an unauthenticated page load but first test CORS
# The logic around trusted origins is coded by us
#
echo '3. Testing end login POST with invalid web origin ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** End login did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** End login returned an unexpected error code"
   exit 1
fi
echo '3. POST to endLogin with an invalid web origin was successfully rejected'

#
# Test sending an end login request to the API as part of an unauthenticated page load
#
echo '4. Testing end login POST for an unauthenticated page load ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then \
  echo "*** Unauthenticated page load failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
IS_LOGGED_IN=$(jq -r .isLoggedIn <<< "$JSON")
HANDLED=$(jq -r .handled <<< "$JSON")
if [ "$IS_LOGGED_IN" != 'false'  ] || [ "$HANDLED" != 'false' ]; then
   echo "*** End login returned an unexpected payload"
   exit 1
fi
echo '4. POST to endLogin for an unauthenticated page load completed successfully'

#
# Test sending a start login request to the API with an invalid origin header
# The logic around trusted origins is coded by us
#
echo '5. Testing POST to start login from invalid web origin ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/start" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Start Login with an invalid web origin did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Start login returned an unexpected error code"
   exit 1
fi
echo '5. POST to startLogin with invalid web origin was not granted access'

#
# Next run the login script
#
echo '6. Starting login ...'
./test-login.sh
if [ $? -ne 0 ]; then
  exit 1
fi
echo '6. Login completed successfully'

#
# Next verify that an injected authorization response is correctly rejected
#
echo '7. Testing posting a malicious code and state into the browser ...'
APP_URL="$WEB_BASE_URL?code=hi0f1340y843thy3480&state=nu2febouwefbjfewbj"
PAGE_URL_JSON='{"pageUrl":"'$APP_URL'"}'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-d $PAGE_URL_JSON \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '400' ]; then
  echo "*** Posting a malicious code and state into the browser did not fail as expected"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'invalid_request' ]; then
   echo "*** End login returned an unexpected error code"
   exit 1
fi
echo '7. Posting a malicious code and state into the browser was handled correctly'

#
# Test an authenticated page load by sending up the main cookies and get the CSRF value
#
echo '8. Testing an authenticated page load ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Authenticated page load failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CSRF=$(jq -r .csrf <<< "$JSON")
IS_LOGGED_IN=$(jq -r .isLoggedIn <<< "$JSON")
HANDLED=$(jq -r .handled <<< "$JSON")
if [ "$IS_LOGGED_IN" != 'true'  ] || [ "$HANDLED" != 'false' ]; then
   echo "*** End login returned an unexpected payload"
   exit 1
fi
echo '8. Authenticated page reload was successful'

#
# Test getting user info with an invalid origin
#
echo '9. Testing GET User Info from an untrusted origin ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/userinfo" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid user info request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** User Info returned an unexpected error code"
   exit 1
fi
echo '9. GET User Info request for an untrusted origin was handled correctly'

#
# Test getting user info without a cookie
#
echo '10. Testing GET User Info without secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/userinfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid user info request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** User Info returned an unexpected error code"
   exit 1
fi
echo '10. GET User Info request without secure cookies was handled correctly'

#
# Test getting user info successfully
#
echo '11. Testing GET User Info with secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/userinfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Getting user info failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "11. GET User Info was successful"

#
# Test getting ID token claims without a cookie
#
echo '12. Testing GET claims without secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/claims" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid claims request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Claims request returned an unexpected error code"
   exit 1
fi
echo '12. GET claims request without secure cookies was handled correctly'

#
# Test getting ID token claims successfully
#
echo '13. Testing GET claims with secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/claims" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Getting claims failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "13. GET claims request was successful"

#
# Test refreshing a token with an invalid origin
#
echo '14. Testing POST to /refresh from an untrusted origin ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit 1
fi
echo '14. POST to /refresh for an untrusted origin was handled correctly'

#
# Test refreshing a token without a cookie
#
echo '15. Testing POST to /refresh without secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit 1
fi
echo '15. POST to /refresh without secure cookies was handled correctly'

#
# Test refreshing a token with secure cookies but with a missing anti forgery token
#
echo '16. Testing POST to /refresh without CSRF token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit 1
fi
echo '16. POST to /refresh without CSRF token was handled correctly'

#
# Test refreshing a token with secure cookies but with an incorrect anti forgery token
#
echo '17. Testing POST to /refresh with incorrect CSRF token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: abc123" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid token refresh request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Refresh returned an unexpected error code"
   exit 1
fi
echo '17. POST to /refresh with incorrect CSRF token was handled correctly'

#
# Test refreshing a token, which will rewrite up to 3 cookies
#
echo '18. Testing POST to /refresh with correct secure details ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit 1
fi
echo '18. POST to /refresh with correct secure details completed successfully'

#
# Test refreshing a token again, to ensure that the new refresh token is used for the refresh
#
echo '19. Testing POST to /refresh with rotated refresh token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit 1
fi
echo '19. POST to /refresh with rotated refresh token completed successfully'

#
# Next expire the access token in the secure cookie, for test purposes
#
echo '20. Expiring the access token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/access/expire" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-d '{"type":"access"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Problem encountered expiring the access token, status: $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "20. Expire access token request was successful"

#
# Test getting user info with an expired access token
#
echo '21. Testing GET User Info with an expired access token returns 401 ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/userinfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo "*** Getting user info did not fail as expected and returned status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "21. GET User Info returned 401 as expected"

#
# Test refreshing the access token now that it is expired
#
echo '22. Testing POST to /refresh to refresh access token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit 1
fi
echo '22. POST to /refresh completed successfully'

#
# Test that getting user info now works
#
echo '23. Testing GET User Info with a fresh access token returns 200 ...'
HTTP_STATUS=$(curl -i -s -k -X GET "$OAUTH_AGENT_BASE_URL/userinfo" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Getting user info failed with status $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "23. GET User Info succeeded with a fresh access token"

#
# Next expire both the refresh token and the access token in secure cookies, for test purposes
#
echo '24. Expiring the refresh token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh/expire" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-d '{"type":"refresh"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '204' ]; then
  echo "*** Problem encountered expiring the access token, status: $HTTP_STATUS"
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
echo "24. Expire refresh token request was successful"

#
# Next try to refresh the token and we should get an invalid_grant error
#
echo '25. Trying to refresh the access token when the session is expired ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/refresh" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-c $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo "*** Refresh request failed with status $HTTP_STATUS"
  JSON=$(tail -n 1 $RESPONSE_FILE) 
  echo $JSON | jq
  exit 1
fi
echo '25. POST to /refresh with expired refresh cookie failed as expected'

#
# Run a fresh login so that we get valid cookies and can test logout
#
echo '26. Testing POST to start login ...'
./test-login.sh
if [ $? -ne 0 ]; then
  exit 1
fi

JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CSRF=$(jq -r .csrf <<< "$JSON")
echo '26. Login completed successfully'

#
# Test logging out with an invalid origin
#
echo '27. Testing logout POST with invalid web origin ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: http://malicious-site.com" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit 1
fi
echo '27. POST to logout with an invalid web origin was successfully rejected'

#
# Test logging out without a cookie
#
echo '28. Testing logout POST without secure cookies ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d '{"pageUrl":"'$WEB_BASE_URL'"}' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit 1
fi
echo '28. POST to logout without secure cookies was successfully rejected'

#
# Test logging out with an incorrect anti forgery token
#
echo '29. Testing logout POST with incorrect anti forgery token ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: abc123" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '401' ]; then
  echo '*** Invalid logout request did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'unauthorized_request' ]; then
   echo "*** Logout returned an unexpected error code"
   exit 1
fi
echo '29. POST to logout with incorrect anti forgery token was successfully rejected'

#
# Test getting the logout URL and clearing cookies successfully
#
echo '30. Testing logout POST with correct secure details ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/logout" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-H "x-$COOKIE_PREFIX-csrf: $CSRF" \
-b $MAIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '200' ]; then
  echo "*** Logout request failed with status $HTTP_STATUS"
  exit 1
fi
echo '30. POST to logout with correct secure details completed successfully'
JSON=$(tail -n 1 $RESPONSE_FILE)
echo $JSON | jq

#
# Test following the end session redirect to sign out in the Curity Identity Server
#
echo '31. Testing following the end session redirect redirect ...'
END_SESSION_REQUEST_URL=$(jq -r .url <<< "$JSON")
HTTP_STATUS=$(curl -i -s -k -X GET $END_SESSION_REQUEST_URL \
-c $LOGIN_COOKIES_FILE \
-o $RESPONSE_FILE -w '%{http_code}')
if [ $HTTP_STATUS != '302' ]; then
  echo "*** Problem encountered during an OpenID Connect end session redirect, status: $HTTP_STATUS"
  exit 1
fi
echo '31. End session redirect completed successfully'

#
# Test sending malformed JSON which currently results in a 500 error
#
echo '32. Testing sending malformed JSON to the OAuth Agent ...'
HTTP_STATUS=$(curl -i -s -k -X POST "$OAUTH_AGENT_BASE_URL/login/end" \
-H "origin: $WEB_BASE_URL" \
-H 'content-type: application/json' \
-H 'accept: application/json' \
-d 'XXX' \
-o $RESPONSE_FILE -w '%{http_code}')
if [ "$HTTP_STATUS" != '500' ]; then
  echo '*** Posting malformed JSON did not fail as expected'
  exit 1
fi
JSON=$(tail -n 1 $RESPONSE_FILE) 
echo $JSON | jq
CODE=$(jq -r .code <<< "$JSON")
if [ "$CODE" != 'server_error' ]; then
   echo '*** Malformed JSON post returned an unexpected error code'
   exit 1
fi
echo '32. Malformed JSON was handled in the expected manner'

# How to Develop the Token Handler

Follow the below steps to get set up for developing and testing the financial-grade token handler.

## Prerequisites

- Ensure that Node.js is installed
- Ensure that Docker Desktop is installed
- Ensure that OpenSSL is installed
- Ensure that the jq tool is installed

Also get a License File for the Curity Identity Server:

- Sign in to the [Curity Developer Portal](https://developer.curity.io/) with your Github account.
- You can get a [Free Community Edition License](https://curity.io/product/community/) if you are new to the Curity Identity Server.

## Update your Hosts File

Ensure that the hosts file contains the following development domain names:

```text
127.0.0.1  api.example.local login.example.local
:1 localhost
```

## Understand URLs

For local development of the token handler the following URLs are used.\
HTTP is used for simplicity, to reduce infrastructure, though it is recommended to update to HTTPS:

| Component | Base URL | Usage |
| --------- | -------- | ----- |
| Token Handler API | http://api.example.local:8080/tokenhandler | This acts as a Back End for Front End for SPAs |
| Curity Identity Server | http://login.example.local:8443 | This will receive a Mutual TLS secret from the token handler | 

## Build and Run the Token Handler API

Run this command from the root folder and the API will then listen on SSL over port 8080.\
Alternatively the API can be run in an IDE of your choice:

```bash
./gradlew bootRun
```

Test that the API is contactable by running this command from the root folder:

```bash
curl --cacert ./certs/example.ca.pem -i -X POST https://api.example.local:8080/tokenhandler/refresh \
-H "origin: https://www.example.local" \
-d {}
```

## Deploy the Curity Identity Server

Copy a license file into the `test/idsvr` folder and then run the following commands:

```bash
cd test/idsvr
./deploy.sh
```

## Test the Token Handler API

The test script can then be used to verify the token handler's operations using the curl tool:

```bash
cd test
./test-token-handler.sh
```

![API Tests](api-tests.png)

## Free Docker Resources

When finished with your development session, free Docker resources like this:

```bash
cd test/idsvr
./teardown.sh
```
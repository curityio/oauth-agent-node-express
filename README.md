# A Node.js OAuth Agent for SPAs

[![Quality](https://img.shields.io/badge/quality-experiment-red)](https://curity.io/resources/code-examples/status/)
[![Availability](https://img.shields.io/badge/availability-source-blue)](https://curity.io/resources/code-examples/status/)

## Overview

The OAuth Agent acts as a modern `Back End for Front End (BFF)` for Single Page Applications.\
This implementation demonstrates the standard pattern for SPAs:

- Strongest browser security with only `SameSite=strict` cookies
- The OpenID Connect flow uses Authorization Code Flow (PKCE) and a client secret

![Logical Components](/doc/logical-components.png)

## Architecture

The following endpoints are used so that the SPA uses simple one liners to perform its OAuth work:

| Endpoint | Description |
| -------- | ----------- |
| POST /login/start | Start a login by providing the request URL to the SPA and setting temporary cookies |
| POST /login/end | Complete a login and issuing secure cookies for the SPA containing encrypted tokens |
| GET /userInfo | Return information from the User Info endpoint for the SPA to display |
| GET /claims | Return ID token claims such as `auth_time` and `acr` |
| POST /refresh | Refresh an access token and rewrite cookies |
| POST /logout | Clear cookies and return an end session request URL |

For further details see the [Architecture](/doc/Architecture.md) article.

## OAuth Agent Development

See the [Setup](/doc/Setup.md) article for details on productive OAuth Agent development.\
This enables a test driven approach to developing the OAuth Agent, without the need for a browser.

## End-to-End SPA Flow

See the below article for details on how to run the end-to-end solution in a browser:

- [SPA Code Example](https://curity.io/resources/learn/token-handler-spa-example/)

## Website Documentation

See the [Curity OAuth for Web Home Page](https://curity.io/product/token-service/oauth-for-web/) for all resources on this design pattern.

## More Information

Please visit [curity.io](https://curity.io/) for more information about the Curity Identity Server.

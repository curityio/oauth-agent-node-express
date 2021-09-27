# The Backend for Frontend API

[![Quality](https://img.shields.io/badge/quality-experiment-red)](https://curity.io/resources/code-examples/status/)
[![Availability](https://img.shields.io/badge/availability-source-blue)](https://curity.io/resources/code-examples/status/)

An API driven `Back End for Front End (BFF)` for SPAs, in line with [best practices for browser based apps](https://datatracker.ietf.org/doc/html/draft-ietf-oauth-browser-based-apps).

## The Token Handler Pattern

A modern evolution of Back End for Front End is used, called the [Token Handler Pattern](https://curity.io/resources/learn/the-token-handler-pattern/):

- The API implements OAuth work and calling the Authorization Server on behalf of the SPA
- This includes sending of OAuth requests, supplying secrets, then receiving tokens and storing them securely
- Only `SameSite=strict` cookies are issued to the SPA, so that recommended browser security is used

See the [Curity OAuth for Web Home Page](https://curity.io/product/token-service/oauth-for-web/) for further documentation.

## Components

The API has the role of an `OAuth Agent`, and performs the intricate OAuth and cookie handling work:

![Logical Components](/images/logical-components.png)

See also the following resources:

- The [Example SPA](https://github.com/curityio/web-oauth-via-bff), which acts as a client to this API.
- The [Example Gateway Plugin](https://github.com/curityio/kong-bff-plugin), which has the `OAuth Proxy` role.

## Implementation

Node and the Express framework are used to build the API, enabling you to deploy it to a host of your choice.\
The API handles token responses from an Authorization Server, then saves encrypted tokens in http-only cookies.\
The API is therefore stateless and easy to manage, and does not require a database.\
The SPA can then use secure cookies to call business APIs, or to get userinfo from this API.

## API Endpoints

The API exposes the following endpoints to the SPA:

1. POST `/login/start`
2. POST `/login/end`
3. GET `/userInfo`
4. POST `/logout`
5. POST `/refresh`

### POST `/login/start`

This endpoint is used to initialize an authorization request. The API responds with a URL which the SPA should navigate to in order to start the authorization flow at the Authorization Server. The URL returned can contain query parameters or be a JAR or PAR URL. However, the format of the URL is irrelevant to the SPA, it should just redirect the user to that URL.

The API responds with a JSON containing the `authorizationRequestUrl` field.

#### Example request

`POST https://bff.example.com/login/start`

Response:
```json
{
  "authorizationRequestUrl": "https://idsvr.example.com/oauth/authorize?client_id=bff_client&response_type=code&scope=openid%20read&redirect_uri=https://www.example.com/"
}
```

### POST `/login/end`

This endpoint should be be called by the SPA on any page load. The SPA sends the current URL to the API, which can either finish the authorization flow (if it was a response from the Authorization Server), or inform the SPA whether the user is logged in or not (basing on the presence of BFF cookies).

#### Example request

```http
POST https://bff.example.com/login/end
pageUrl=http://www.example.com?code=abcdef&state=qwerty
```

The response will contain a few `Set-Cookie` headers.

### GET `/userInfo`

Endpoint which returns claims of the ID token contained in the session cookie.

#### Example

```http
GET https://bff.example.com
Cookie: myBFFSess=2558e7806c0523fd96d105...
```

Response

```json
{
  "exp":1626263589,
  "nbf":1626259989,
  "jti":"34e76304-0bc3-46ee-bc70-e21685eb5282",
  "iss":"https://idsvr.example.com/oauth",
  "aud":"bff-client",
  "sub":"user",
  "auth_time":1626259937,
  "iat":1626259989
}
```

### POST `/logout`

This endpoint can be called to get a logout URL. The SPA should navigate the user to that URL in order to perform a logout in the Authorization Server. The API also sets empty session cookies in the response. 

### POST `/refresh`

This endpoint can be called to force the API to refresh the access token. If the API is able to perform the refresh new cookies will be set in the response (which is a 204 response), otherwise the API will respond with a 401 response (e.g. when the refresh token is expired) to inform the SPA that a new login is required. 

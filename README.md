# The Backend-For-Frontend API

A node implementation of the BFF API using the Express framework. The API can be deployed to a host of your choice.

This BFF is a stateless one. It takes the token response from an Authorization Server, encrypts tokens and sets them in http-only cookies. Those cookies can then be used to get user info or call business APIs.

## Endpoints of the BFF API

The BFF API exposes the following endpoints:

1. POST `/login/start`
2. POST `/login/end`
3. GET `/userInfo`
4. POST `/logout`
5. POST `/refresh`

### POST `/login/start`

This endpoint is used to initialize an authorization request. The API responds with a URL which the SPA should navigate to in order to start the authorization flow at the Authorization Server. The URL returned can contain query parameters or be a JAR or PAR URL. However, the format of the URL is irrelevant to the SPA, it should just redirect the user to that URL.

The BFF responds with a JSON containing the `authorizationRequestUrl` field.

#### Example request

`POST https://bff.example.com/login/start`

Response:
```json
{
  "authorizationRequestUrl": "https://idsvr.example.com/oauth/authorize?client_id=bff_client&response_type=code&scope=openid%20read&redirect_uri=https://www.example.com/"
}
```

### POST `/login/end`

This endpoint should be be called by the SPA on any page load. The SPA sends the current URL to the BFF, which can either finish the authorization flow (if it was a response from the Authorization Server), or inform the SPA whether the user is logged in or not (basing on the presence of BFF cookies).

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

This endpoint can be called to get a logout URL. The SPA should navigate the user to that URL in order to perform a logout in the Authorization Server. The BFF also sets empty session cookies in the response. 

### POST `/refresh`

This endpoint can be called to force the BFF to refresh the access token. If the BFF is able to perform the refresh new cookies will be set in the response (which is a 204 response), otherwise the BFF will respond with a 401 response (e.g. when the refresh token is expired) to inform the SPA that a new login is required. 

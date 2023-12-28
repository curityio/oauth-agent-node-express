import {assert} from 'chai';
import fetch, {RequestInit} from 'node-fetch';
import {config} from '../../src/config.js';
import {fetchStubbedResponse, performLogin} from './testUtils.js'

// Tests to focus on returning user information to the SPA via the user info endpoint
describe('UserInfoControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Requesting user info from an untrusted origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/userInfo`,
            {
                method: 'GET',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting user info without session cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/userInfo`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting user info with valid cookies should return user data', async () => {

        const [, , cookieString] = await performLogin()
        const response = await fetch(
            `${oauthAgentBaseUrl}/userInfo`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    cookie: cookieString,
                },
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.given_name, 'Demo')
        assert.equal(body.family_name, 'User')
    })

    it("An expired access token when retrieving user info should return a 401 status so that the SPA knows to try a token refresh", async () => {

        const [, , cookieString] = await performLogin()
        
        const options = {
            method: 'GET',
            headers: {
                origin: config.trustedWebOrigins[0],
                cookie: cookieString,
            },
        } as RequestInit
        
        const stubbedResponse = {
            id: '1527eaa0-6af2-45c2-a2b2-e433eaf7cf04',
            priority: 1,
            request: {
                method: 'POST',
                url: '/oauth/v2/oauth-userinfo'
            },
            response: {

                // This will be returned from the Authorization Server if the access token is expired during a userinfo request
                status: 401,
                body: "{\"error\":\"invalid_token\"}"
            }
        }

        const response = await fetchStubbedResponse(stubbedResponse, async () => {
            return await fetch(`${oauthAgentBaseUrl}/userInfo`, options)
        })

        // The SPA will trigger token refresh when the OAuth Agent reports an expired access token
        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'token_expired', 'Incorrect error code')
    })
})

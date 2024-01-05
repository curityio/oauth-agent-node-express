import {assert, expect} from 'chai'
import fetch, {RequestInit} from 'node-fetch'
import {config} from '../../src/config.js'
import {getCookieString, performLogin} from './testUtils.js'
import {OAuthAgentErrorResponse, OAuthAgentLogoutResponse} from "./responses.js";

// Tests to focus on the logout endpoint
describe('LogoutControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Posting to logout from a malicious origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/logout`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentErrorResponse
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Posting to logout without cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/logout`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentErrorResponse
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Posting incorrect CSRF token to logout should return a 401 response', async () => {

        const [, , cookieString] = await performLogin()

        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        (options.headers as any)[`x-${config.cookieNamePrefix}-csrf`] = 'abc123'
       
        const response = await fetch(`${oauthAgentBaseUrl}/logout`, options)

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentErrorResponse
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it("Posting to logout with correct session cookies should return a 200 response and clear cookies", async () => {

        const [, loginBody, cookieString] = await performLogin()
        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        (options.headers as any)[`x-${config.cookieNamePrefix}-csrf`] = loginBody['csrf']
       
        const response = await fetch(`${oauthAgentBaseUrl}/logout`, options)

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentLogoutResponse
        const endSessionRequestUrl = body.url as string
        expect(endSessionRequestUrl).contains(`client_id=${config.clientID}`, 'Invalid end session request URL')

        const clearedCookies = getCookieString(response);
        assert.equal(clearedCookies, "example-auth=;example-at=;example-id=;example-csrf=;", 'Incorrect cleared cookies string')
    })
})

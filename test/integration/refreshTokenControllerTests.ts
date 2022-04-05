import {assert, expect} from 'chai'
import fetch, {RequestInit, Response} from 'node-fetch'
import {config} from '../../src/config'
import {fetchStubbedResponse, getCookieString, performLogin} from './testUtils'

describe('RefreshTokenControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Sending POST request to refresh endpoint from untrusted origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/refresh`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Sending POST request to refresh endpoint without session cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/refresh`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Posting to refresh endpoint with incorrect CSRF token should return a 401 response', async () => {

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

        const response = await fetch(`${oauthAgentBaseUrl}/refresh`, options)

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it("Posting correct cookies to refresh endpoint should return a new set of cookies", async () => {

        const [, loginBody, cookieString] = await performLogin()

        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        
        const customHeaders = options.headers as any
        customHeaders[`x-${config.cookieNamePrefix}-csrf`] = loginBody.csrf

        const response = await fetch(`${oauthAgentBaseUrl}/refresh`, options)
        
        assert.equal(response.status, 204, 'Incorrect HTTP status')
        const rewrittenCookieString = getCookieString(response)
        expect(rewrittenCookieString, 'Missing secure cookies').length.above(0)
        assert.notEqual(rewrittenCookieString, cookieString)
    })

    it("A 4xx response from the Identity Server when refreshing tokens should result in a 401 response", async () => {

        const [, loginBody, cookieString] = await performLogin()

        const options = {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
                'Content-Type': 'application/json',
                cookie: cookieString,
            },
        } as RequestInit
        
        const customHeaders = options.headers as any
        customHeaders[`x-${config.cookieNamePrefix}-csrf`] = loginBody.csrf

        const stubbedResponse = {
            id: '1527eaa0-6af2-45c2-a2b2-e433eaf7cf04',
            priority: 1,
            request: {
                method: 'POST',
                'url': '/oauth/v2/oauth-token'
            },
            response: {
                status: 400,
                body: "{\"error\":\"invalid_client\"}"
            }
        }
        const response = await fetchStubbedResponse(stubbedResponse, async () => {
            return await fetch(`${oauthAgentBaseUrl}/refresh`, options)
        })

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })
})

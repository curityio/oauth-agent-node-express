import {assert, expect} from 'chai';
import fetch from 'node-fetch';
import {config} from '../../src/config.js';
import {performLogin} from './testUtils.js'
import {OAuthAgentClaimsResponse, OAuthAgentErrorResponse} from "./responses.js";

// Tests to focus on returning ID token details
describe('ClaimsControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Requesting claims from an untrusted origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentErrorResponse
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting claims without session cookies should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentErrorResponse
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Requesting claims with valid cookies should return ID Token claims', async () => {

        const [, , cookieString] = await performLogin()
        const response = await fetch(
            `${oauthAgentBaseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    cookie: cookieString,
                },
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as OAuthAgentClaimsResponse
        expect(body.auth_time.toString(), 'Missing auth_time claim').length.above(0)
    })
})
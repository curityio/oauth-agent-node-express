import {assert, expect} from 'chai'
import fetch from 'node-fetch'
import {config} from '../../src/config'
import {performLogin} from './testUtils'

describe('LoginControllerTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Sending an OPTIONS request with wrong Origin should return 204 response without CORS headers', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'OPTIONS',
                headers: {
                    origin: 'https://malicious-site.com',
                },
            },
        )

        assert.equal(response.status, 204, 'Incorrect HTTP status')
        assert.equal(response.headers.get('access-control-allow-origin'), null, 'Incorrect allowed origin');
    })

    it('Sending OPTIONS request with a valid web origin should return a 204 response with proper CORS headers', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'OPTIONS',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 204, 'Incorrect HTTP status')
        assert.equal(response.headers.get('access-control-allow-origin'), config.trustedWebOrigins[0], 'Incorrect allowed origin');
    })

    it('Request to end login with invalid web origin should return 401 response', async () => {

        const payload = {
            pageUrl: 'http://www.example.com'
        }
        const response = await fetch(
            `${oauthAgentBaseUrl}/login/end`,
            {
                method: 'POST',
                headers: {
                    origin: 'https://malicious-site.com',
                },
                body: JSON.stringify(payload),
            },
        )

        assert.equal(response.status, 401, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })

    it('Request to end login should return correct unauthenticated response', async () => {

        const payload = {
            authorizationUrl: 'http://www.example.com'
        }
        const response = await fetch(
            `${oauthAgentBaseUrl}/login/end`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
                body: JSON.stringify(payload),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        assert.equal(body.isLoggedIn, false, 'Incorrect isLoggedIn value')
        assert.equal(body.handled, false, 'Incorrect handled value')
    })

    it('POST request to start login with invalid web origin should return a 401 response', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
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

    it('Request to start login should return authorization request URL', async () => {

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                },
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string
        expect(authorizationRequestUrl).contains(`client_id=${config.clientID}`, 'Invalid authorization request URL')
    })

    it('Posting a code flow response to login end should result in authenticating the user', async () => {

        const [status, body] = await performLogin()

        assert.equal(status, 200, 'Incorrect HTTP status')
        assert.equal(body.isLoggedIn, true, 'Incorrect isLoggedIn value')
        assert.equal(body.handled, true, 'Incorrect handled value')
        expect(body.csrf, 'Missing csrfToken value').length.above(0)
    })
})

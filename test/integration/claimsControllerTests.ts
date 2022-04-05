import {assert} from 'chai';
import fetch from 'node-fetch';
import {config} from '../../src/config';

describe('ClaimsController', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    /*it('Requesting claims from an untrusted origin should return a 401 response', async () => {

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
        const body = await response.json()
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
        const body = await response.json()
        assert.equal(body.code, 'unauthorized_request', 'Incorrect error code')
    })*/

    // TODO: make this pass by implementing startLogin and endLogin
    /*it('Requesting claims with valid cookies should return ID Token claims', async () => {

        const response = await fetch(
            `${baseUrl}/claims`,
            {
                method: 'GET',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    cookie: 'example-id: xxx',
                },
            },
        )
        assert.equal(response.status, 200, 'GET claims with valid cookies returned incorrect HTTP status')
        const body = await response.json()
        console.log(body)
    })*/
})

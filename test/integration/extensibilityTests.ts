import {assert, expect} from 'chai'
import fetch from 'node-fetch'
import {config} from '../../src/config.js'
import {OauthAgentStartResponse} from "./responses.js";

// Tests to focus on extra details the SPA may need to supply at runtime
describe('ExtensibilityTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Starting a login request with a simple OpenID Connect parameter should include it in the request URL', async () => {

        const options = {
            extraParams: [
                {
                    key: 'prompt',
                    value: 'login',
                },
            ],
        }

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    'content-type': 'application/json',
                },
                body: JSON.stringify(options),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as OauthAgentStartResponse
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        expect(authorizationRequestUrl).contains(
            `${options.extraParams[0].key}=${options.extraParams[0].value}`,
            'The extra parameter was not added to the authorization request URL')
    })

    it('Starting a login request with multiple OpenID Connect parameters should include them in the request URL', async () => {

        const claims = {
            id_token: {
                acr: {
                    essential: true,
                    values: [
                        "urn:se:curity:authentication:html-form:htmlform1"
                    ]
                }
            }
        }
        const claimsText = JSON.stringify(claims)

        const options = {
            extraParams: [
                {
                    key: 'ui_locales',
                    value: 'fr',
                },
                {
                    key: 'claims',
                    value: claimsText,
                },
            ],
        }

        const response = await fetch(
            `${oauthAgentBaseUrl}/login/start`,
            {
                method: 'POST',
                headers: {
                    origin: config.trustedWebOrigins[0],
                    'content-type': 'application/json',
                },
                body: JSON.stringify(options),
            },
        )

        assert.equal(response.status, 200, 'Incorrect HTTP status')
        const body = await response.json() as OauthAgentStartResponse
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        options.extraParams.forEach((p: any) => {
            expect(authorizationRequestUrl).contains(
                `${p.key}=${encodeURIComponent(p.value)}`,
                'The extra parameters were not added to the authorization request URL')
        })
    })
})

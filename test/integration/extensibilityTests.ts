import {assert, expect} from 'chai'
import fetch from 'node-fetch'
import {config} from '../../src/config'

// Tests to focus on extra details the SPA may need to supply at runtime
describe('ExtensibilityTests', () => {

    const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

    it('Starting a login request with a runtime OpenID Connect parameter should include it in the request URL', async () => {

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
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        expect(authorizationRequestUrl).contains(
            `${options.extraParams[0].key}=${options.extraParams[0].value}`,
            'The extra parameter was not added to the authorization request URL')
    })

    it('Starting a login request with multiple OpenID Connect parameters should include them in the request URL', async () => {

        const options = {
            extraParams: [
                {
                    key: 'max-age',
                    value: '3600',
                },
                {
                    key: 'ui_locales',
                    value: 'fr',
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
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string
        
        options.extraParams.forEach((p: any) => {
            expect(authorizationRequestUrl).contains(
                `${p.key}=${p.value}`,
                'The extra parameters were not added to the authorization request URL')
        })
    })

    it('Starting a login request with the OpenID Connect acr_values parameter should include it in the request URL', async () => {

        const options = {
            extraParams: [
                {
                    key: 'acr_values',
                    value: 'urn:se:curity:authentication:html-form:htmlform1',
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
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string
        
        expect(authorizationRequestUrl).contains(
            `${options.extraParams[0].key}=${encodeURIComponent(options.extraParams[0].value)}`,
            'The acr_values parameter was not added to the authorization request URL')
    })

    it('Starting a login request with the OpenID Connect claims parameter should include it in the request URL', async () => {

        const claims = {
            id_token: {
                acr: {
                    essential: true,
                    values: [
                        "urn:se:curity:authentication:html-form:htmlform1"
                    ]
                },
                my_custom_claim: {
                    essential: true
                }
            }
        }
        const claimsText = JSON.stringify(claims)

        const options = {
            extraParams: [
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
        const body = await response.json()
        const authorizationRequestUrl = body.authorizationRequestUrl as string

        expect(authorizationRequestUrl).contains(
            `${options.extraParams[0].key}=${encodeURIComponent(options.extraParams[0].value)}`,
            'The claims parameter was not correctly added to the authorization request URL')
    })
})

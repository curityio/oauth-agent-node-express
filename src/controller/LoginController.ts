/*
 *  Copyright 2021 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import * as express from 'express'
import {
    ValidateRequestOptions,
    createAuthorizationRequest,
    handleAuthorizationResponse,
    validateIDtoken,
    decryptCookie,
    getCSRFCookieName,
    getTokenEndpointResponse,
    getTempLoginDataCookie,
    getTempLoginDataCookieName,
    getCookiesForTokenResponse,
    getATCookieName,
    generateRandomString,
} from '../lib'
import {config} from '../config'
import validateExpressRequest from '../validateExpressRequest'
import {asyncCatch} from '../middleware/exceptionMiddleware';

class LoginController {
    public router = express.Router()

    constructor() {
        this.router.post('/start', asyncCatch(this.startLogin))
        this.router.post('/end', asyncCatch(this.handlePageLoad))
    }

    /*
     * The SPA calls this endpoint to ask the OAuth Agent for the authorization request URL
     */
    startLogin = async (req: express.Request, res: express.Response) => {

        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false
        validateExpressRequest(req, options)

        const authorizationRequestData = createAuthorizationRequest(config, req.body)

        res.setHeader('Set-Cookie',
            getTempLoginDataCookie(authorizationRequestData.codeVerifier, authorizationRequestData.state, config.cookieOptions, config.cookieNamePrefix, config.encKey))
        res.status(200).json({
            authorizationRequestUrl: authorizationRequestData.authorizationRequestURL
        })
    }

    /*
     * The SPA posts its URL here on every page load, to get its authenticated state
     * When an OAuth response is received it is handled and cookies are written
     */
    handlePageLoad = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        const options = new ValidateRequestOptions()
        options.requireCsrfHeader = false
        validateExpressRequest(req, options)
        
        const data = await handleAuthorizationResponse(req.body?.pageUrl)
        
        let isLoggedIn = false
        let handled = false
        let csrfToken: string = ''

        if (data.code && data.state) {
            
            const tempLoginData = req.cookies ? req.cookies[getTempLoginDataCookieName(config.cookieNamePrefix)] : undefined
            
            const tokenResponse = await getTokenEndpointResponse(config, data.code, data.state, tempLoginData)
            if (tokenResponse.id_token) {
                validateIDtoken(config, tokenResponse.id_token)
            }

            csrfToken = generateRandomString()
            const csrfCookie = req.cookies[getCSRFCookieName(config.cookieNamePrefix)]
            if (csrfCookie) {
                
                try {
                    // Avoid setting a new value if the user opens two browser tabs and signs in on both
                    csrfToken = decryptCookie(config.encKey, csrfCookie)

                } catch (e) {

                    // If the system has been redeployed with a new cookie encryption key, decrypting old cookies from the browser will fail
                    // In this case generate a new CSRF token so that the SPA can complete its login without errors
                    csrfToken = generateRandomString()
                }
            } else {

                // Generate a new value otherwise
                csrfToken = generateRandomString()
            }

            const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config, true, csrfToken)
            res.set('Set-Cookie', cookiesToSet)
            handled = true
            isLoggedIn = true

        } else {
            
            // During a page reload, return the existing anti forgery token
            isLoggedIn = !!(req.cookies && req.cookies[getATCookieName(config.cookieNamePrefix)])
            if (isLoggedIn) {

                csrfToken = decryptCookie(config.encKey, req.cookies[getCSRFCookieName(config.cookieNamePrefix)])
            }
        }

        const responseBody = {
            handled,
            isLoggedIn,
        } as any
        
        if (csrfToken) {
            responseBody.csrf = csrfToken
        }

        res.status(200).json(responseBody)
    }
}

export default LoginController
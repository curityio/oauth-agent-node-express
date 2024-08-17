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

import express from 'express'
import {
    createAuthorizationRequest,
    handleAuthorizationResponse,
    validateIDtoken,
    getTokenEndpointResponse,
    getTempLoginDataCookie,
    getTempLoginDataCookieName,
    getCookiesForTokenResponse,
    getATCookieName,
} from '../lib/index.js'
import {config} from '../config.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js';

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

        validateExpressRequest(req);

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

        validateExpressRequest(req);

        const data = await handleAuthorizationResponse(req.body?.pageUrl)
        
        let isLoggedIn = false
        let handled = false

        if (data.code && data.state) {

            const tempLoginData = req.cookies ? req.cookies[getTempLoginDataCookieName(config.cookieNamePrefix)] : undefined
            const tokenResponse = await getTokenEndpointResponse(config, data.code, data.state, tempLoginData)
            if (tokenResponse.id_token) {
                validateIDtoken(config, tokenResponse.id_token)
            }

            const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config, true)
            res.set('Set-Cookie', cookiesToSet)
            handled = true
            isLoggedIn = true

        } else {
            
            // During a page reload, return the existing anti forgery token
            isLoggedIn = !!(req.cookies && req.cookies[getATCookieName(config.cookieNamePrefix)])
        }

        const responseBody = {
            handled,
            isLoggedIn,
        } as any
        
        res.status(200).json(responseBody)
    }
}

export default LoginController
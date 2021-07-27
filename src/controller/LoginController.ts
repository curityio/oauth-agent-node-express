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
import * as urlparse from 'url-parse'
import {
    getAuthorizationURL,
    getTokenEndpointResponse,
    getTempLoginDataCookie,
    getTempLoginDataCookieName,
    getCookiesForTokenResponse,
    getAuthCookieName, generateRandomString
} from '../lib'
import {config} from '../config'
import validateExpressRequest from '../validateExpressRequest'

class LoginController {
    public router = express.Router()

    constructor() {
        this.router.post('/start', this.startLogin)
        this.router.post('/end', this.handlePageLoad)
    }

    startLogin = (req: express.Request, res: express.Response) => {
        const authorizationRequestData = getAuthorizationURL(config)

        res.setHeader('Set-Cookie',
            getTempLoginDataCookie(authorizationRequestData.codeVerifier, authorizationRequestData.state, config.cookieOptions, config.cookieNamePrefix, config.encKey))
        res.status(200).json({
            authorizationRequestUrl: authorizationRequestData.authorizationRequestURL
        })
    }

    /*
     * The SPA posts its URL here on every page load, and this operation ends a login when required
     * The API works out whether it is an OAuth response, eg:
     * - code + state query parameters
     * - code + error query parameters
     * - JARM response parameters
     */
    handlePageLoad = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        // Early logic to check for an OAuth response
        const data = this.getUrlParts(req.body?.pageUrl)
        const isOAuthResponse = !!(data.state && data.code)

        let isLoggedIn: boolean
        let csrfToken:string
        
        if (isOAuthResponse) {
            try {
                const tempLoginData = req.cookies ? req.cookies[getTempLoginDataCookieName(config.cookieNamePrefix)] : undefined
                const tokenResponse = await getTokenEndpointResponse(config, data.code, data.state, tempLoginData)
                csrfToken = generateRandomString()
                const cookiesToSet = getCookiesForTokenResponse(tokenResponse, config, true, csrfToken)

                res.set('Set-Cookie', cookiesToSet)
            } catch (error) {
                return next(error)
            }
            isLoggedIn = true

        } else {
            try {
                validateExpressRequest(req)
            } catch (error) {
                return next(error)
            }

            // See if we have a session cookie
            isLoggedIn = !!(req.cookies && req.cookies[getAuthCookieName(config.cookieNamePrefix)])
        }

        //
        // Give the client the data it needs
        //
        // isLoggedIn enables the SPA to know it does not need to present a login option:
        // - after a page reload or opening a new browser tab
        //
        // handled enables the SPA to know a login has just completed
        // - the SPA can restore its pre redirect state
        // - the SPA can update the browser history API to reset back navigation
        //

        const responseBody = {
            handled: isOAuthResponse,
            isLoggedIn,
        } as any

        if (csrfToken) {
            responseBody.csrf = csrfToken
        }

        res.status(200).json(responseBody)
    }

    getUrlParts(url?: string): any {
        
        if (url) {
            const urlData = urlparse(url, true)
            if (urlData.query) {
                return urlData.query
            }
        }

        return {}
    }
}

export default LoginController

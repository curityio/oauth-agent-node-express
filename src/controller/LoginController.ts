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
    decryptCookie,
    getAuthorizationURL,
    getCSRFCookieName,
    getTokenEndpointResponse,
    getTempLoginDataCookie,
    getTempLoginDataCookieName,
    getCookiesForTokenResponse,
    getAuthCookieName,
    generateRandomString,
} from '../lib'
import {ValidateRequestData, ValidateRequestOptions} from '../lib/validateRequest';
import {config} from '../config'
import validateExpressRequest from '../validateExpressRequest'

class LoginController {
    public router = express.Router()

    constructor() {
        this.router.post('/start', this.startLogin)
        this.router.post('/end', this.handlePageLoad)
    }

    startLogin = (req: express.Request, res: express.Response) => {

        // Check the web origin
        const options = new ValidateRequestOptions();
        options.requireCsrfHeader = false;
        validateExpressRequest(req, options)

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

        // Check the web origin
        try {
            const options = new ValidateRequestOptions()
            options.requireCsrfHeader = false
            validateExpressRequest(req, options)
        } catch (error) {
            return next(error)
        }
        
        // Early logic to check for an OAuth response
        const data = this.getUrlParts(req.body?.pageUrl)
        const isOAuthResponse = !!(data.state && data.code)

        let isLoggedIn: boolean
        let csrfToken:string
        
        if (isOAuthResponse) {
            try {
                
                // When processing a login, do the OAuth work, set cookies and create an anti forgery token
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
            
            // See if we have a session cookie
            isLoggedIn = !!(req.cookies && req.cookies[getAuthCookieName(config.cookieNamePrefix)])
            if (isLoggedIn) {

                // During an authenticated page refresh or opening a new browser tab, we must return the anti forgery token
                // This enables an XSS attack to get the value, but this is standard for CSRF tokens
                csrfToken = decryptCookie(config.encKey, req.cookies[getCSRFCookieName(config.cookieNamePrefix)])
            }
        }

        // isLoggedIn enables the SPA to know it does not need to present a login option
        // handled enables the SPA to know a login has just completed
        const responseBody = {
            handled: isOAuthResponse,
            isLoggedIn,
        } as any

        // The CSRF token is required for subsequent operations
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

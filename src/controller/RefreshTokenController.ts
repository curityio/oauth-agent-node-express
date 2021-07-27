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
import {config} from '../config'
import {InvalidBFFCookieException} from '../lib/exceptions'
import {getAuthCookieName, getCookiesForTokenResponse, refreshAccessToken} from '../lib'
import validateExpressRequest from '../validateExpressRequest'

class RefreshTokenController {
    public router = express.Router()

    constructor() {
        this.router.post('/', this.RefreshTokenFromCookie)
    }

    RefreshTokenFromCookie = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            validateExpressRequest(req)
        } catch(error) {
            return next(error)
        }

        const authCookieName = getAuthCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[authCookieName]) {
            try {
                const tokenResponse = await refreshAccessToken(req.cookies[authCookieName], config)
                if (tokenResponse?.isNewAccessToken) {
                    const cookiesToSet = getCookiesForTokenResponse(tokenResponse.tokenEndpointResponse, config)
                    res.setHeader('Set-Cookie', cookiesToSet)
                }
                res.status(204).send()
            } catch (error) {
                return next(error)
            }
        } else {
            throw new InvalidBFFCookieException()
        }
    }
}

export default RefreshTokenController

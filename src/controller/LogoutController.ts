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
import {getAuthCookieName, getCookiesForUnset, getCSRFCookieName, getLogoutURL} from '../lib'
import {InvalidBFFCookieException} from '../lib/exceptions'
import validateExpressRequest from '../validateExpressRequest'

class LogoutController {
    public router = express.Router()

    constructor() {
        this.router.get('/', this.logoutUser)
    }

    logoutUser = (req: express.Request, res: express.Response, next: express.NextFunction) => {
        try {
            validateExpressRequest(req)
        } catch(error) {
            return next(error)
        }

        if (req.cookies && req.cookies[getAuthCookieName(config.cookieNamePrefix)]) {
            const logoutURL = getLogoutURL(config)
            res.setHeader('Set-Cookie', getCookiesForUnset(config.cookieOptions, config.cookieNamePrefix))
            res.json({ url: logoutURL})
        } else {
            throw new InvalidBFFCookieException()
        }
    }
}

export default LogoutController

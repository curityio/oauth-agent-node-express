/*
 *  Copyright 2022 Curity AB
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
import {getIDCookieName, getIDTokenClaims} from '../lib/index.js'
import {config} from '../config.js'
import {InvalidCookieException} from '../lib/exceptions/index.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js';

class ClaimsController {
    public router = express.Router()

    constructor() {
        this.router.get('/', asyncCatch(this.getClaims))
    }

    getClaims = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        validateExpressRequest(req);

        const idTokenCookieName = getIDCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[idTokenCookieName]) {

            const userData = getIDTokenClaims(config.encKey, req.cookies[idTokenCookieName])
            res.status(200).json(userData)

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'No ID cookie was supplied in a call to get claims'
            throw error
        }
    }
}

export default ClaimsController

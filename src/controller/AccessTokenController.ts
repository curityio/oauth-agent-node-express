import express from 'express'
import {decryptCookie, getATCookieName, getCookiesForAccessTokenExpiry} from '../lib/index.js'
import {config} from '../config.js'
import {InvalidCookieException} from '../lib/exceptions/index.js'
import validateExpressRequest from '../validateExpressRequest.js'
import {asyncCatch} from '../middleware/exceptionMiddleware.js';

class AccessTokenController {
    public router = express.Router()

    constructor() {
        this.router.post('/expire', asyncCatch(this.ExpireAccessToken))
    }

    // To simulate expiry for test purposes
    ExpireAccessToken = async (req: express.Request, res: express.Response, next: express.NextFunction) => {

        validateExpressRequest(req);

        const atCookieName = getATCookieName(config.cookieNamePrefix)
        if (req.cookies && req.cookies[atCookieName]) {

            const accessToken = decryptCookie(config.encKey, req.cookies[atCookieName])
            const expiredAccessToken = `${accessToken}x`
            const cookiesToSet = getCookiesForAccessTokenExpiry(config, expiredAccessToken)
            res.setHeader('Set-Cookie', cookiesToSet)
            res.status(204).send()

        } else {
            const error = new InvalidCookieException()
            error.logInfo = 'Valid cookies were not supplied in a call to expireToken'
            throw error
        }
    }
}

export default AccessTokenController

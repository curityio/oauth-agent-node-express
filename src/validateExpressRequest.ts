import validateRequest from './lib/validateRequest'
import {config} from './config'
import {getCSRFCookieName} from './lib'
import * as express from 'express'

export default function validateExpressRequest(req: express.Request) {
    validateRequest(
        req.header('x-' + config.cookieNamePrefix + '-csrf'),
        req.cookies && req.cookies[getCSRFCookieName(config.cookieNamePrefix)],
        req.header('Origin'),
        config.trustedWebOrigins,
        config.encKey
    )
}

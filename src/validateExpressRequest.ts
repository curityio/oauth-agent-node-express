import validateRequest, {ValidateRequestData, ValidateRequestOptions} from './lib/validateRequest'
import {config} from './config'
import {getCSRFCookieName} from './lib'
import * as express from 'express'

export default function validateExpressRequest(req: express.Request, options: ValidateRequestOptions) {

    const data = new ValidateRequestData(
        req.header('x-' + config.cookieNamePrefix + '-csrf'),
        req.cookies && req.cookies[getCSRFCookieName(config.cookieNamePrefix)],
        req.header('Origin'),
        config.trustedWebOrigins,
        config.encKey,
    )

    validateRequest(data, options)
}

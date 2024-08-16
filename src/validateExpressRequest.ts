import express from 'express'
import {UnauthorizedException} from './lib/exceptions/index.js'

export default function validateExpressRequest(req: express.Request) {

    if (req.header('token-handler-version') !== '1') {
        const error = new UnauthorizedException()
        error.logInfo = 'The request did not contain the required custom header'
        throw error
    }
}

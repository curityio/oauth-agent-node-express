import {NextFunction, Request, Response} from 'express';
import {OAuthAgentException} from '../lib/exceptions'
import {UnhandledException} from '../lib/exceptions'
import {RequestLog} from './requestLog';

export default function exceptionMiddleware(
    caught: any,
    request: Request,
    response: Response,
    next: NextFunction): void {

    const exception = caught instanceof OAuthAgentException ? caught : new UnhandledException(caught)
    
    if (!response.locals.log) {
        
        // For malformed JSON errors, middleware does not get created so write the whole log here
        response.locals.log = new RequestLog()
        response.locals.log.start(request)
        response.locals.log.addError(exception)
        response.locals.log.end(response)

    } else {

        // Otherwise just include error details in logs
        response.locals.log.addError(exception)
    }
    
    // Send the response to the client
    const statusCode = exception.statusCode
    const data = { code: exception.code, message: exception.message}
    response.status(statusCode).send(data)
}

/*
 * Unhandled promise rejections may not be caught properly
 * https://medium.com/@Abazhenov/using-async-await-in-express-with-node-8-b8af872c0016
 */
export function asyncCatch(fn: any): any {

    return (request: Request, response: Response, next: NextFunction) => {

        Promise
            .resolve(fn(request, response, next))
            .catch((e) => {
                exceptionMiddleware(e, request, response, next)
            })
    };
}
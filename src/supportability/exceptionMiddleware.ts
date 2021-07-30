import {NextFunction, Request, Response} from 'express';
import {BFFException} from '../lib/exceptions'

export default function exceptionMiddleware(
    err: any,
    request: Request,
    response: Response,
    next: NextFunction): void {

    let statusCode = 500
    let data = { code: 'server_error', message: 'A technical problem occurred in the BFF API' }

    if (err instanceof BFFException) {

        statusCode = err.statusCode
        data = { code: err.code, message: err.message}
        response.locals.log.setError(err)
    }

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
                exceptionMiddleware(e, request, response, next);
            });
    };
}
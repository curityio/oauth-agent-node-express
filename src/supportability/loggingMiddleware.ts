import {NextFunction, Request, Response} from 'express'
import {RequestLog} from './requestLog'

export default function loggingMiddleware(
    request: Request,
    response: Response,
    next: NextFunction) {

        response.locals.log = new RequestLog()
        response.locals.log.start(request)
        
        response.on('finish', () => {
            response.locals.log.end(response)
        })

        next();
}

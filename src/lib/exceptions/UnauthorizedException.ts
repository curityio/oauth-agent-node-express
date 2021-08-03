import BFFException from './BFFException'

export default class UnauthorizedException extends BFFException {
    public statusCode = 401
    public code = 'unauthorized_request'
    public cause?: Error

    constructor(cause?: Error) {
        super("Access denied due to invalid request details")

        this.cause = cause
    }
}

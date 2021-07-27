import BFFException from './BFFException'

export default class InvalidRequestException extends BFFException {
    public statusCode = 401
    public code = 'invalid_request'
    public cause?: Error

    constructor(cause?: Error) {
        super("Request is invalid")

        this.cause = cause
    }
}

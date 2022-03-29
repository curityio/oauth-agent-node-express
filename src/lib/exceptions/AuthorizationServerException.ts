import OAuthAgentException from './OAuthAgentException'

export default class AuthorizationServerException extends OAuthAgentException {
    public statusCode = 502
    public code = 'authorization_server_error'
    public cause?: Error

    constructor(cause?: Error) {
        super('A problem occurred with a request to the Authorization Server')
        this.cause = cause
    }
}

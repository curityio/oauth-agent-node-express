import OAuthAgentException from './OAuthAgentException'

export default class UnhandledException extends OAuthAgentException {
    public statusCode = 500
    public code = 'server_error'
    public cause?

    constructor(cause?: Error) {
        super("A technical problem occurred in the OAuth Agent")
        this.cause = cause
    }
}
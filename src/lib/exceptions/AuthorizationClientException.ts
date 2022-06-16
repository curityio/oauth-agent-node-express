import OAuthAgentException from './OAuthAgentException'

export default class AuthorizationClientException extends OAuthAgentException {
    
    // By default the SPA will present an error when the Authorization Server returns an
    public statusCode = 400
    public code = 'authorization_error'
    public description = ''

    constructor() {
        super('A request sent to the Authorization Server was rejected')
    }

    // User info requests can fail, in which case inform the SPA so that it can avoid an error display
    public onUserInfoFailed(status: number) {

        if (status == 401) {

            this.code = 'token_expired'
            this.statusCode = 401
        }
    }

    // Token refresh will fail eventually, in which case inform the SPA so that it can avoid an error display
    public onTokenRefreshFailed(text: string) {

        const data = this.parseAuthorizationServerErrorResponse(text)
        if (data.error === 'invalid_grant') {

            this.code = 'session_expired'
            this.statusCode = 401
        }
    }

    // The error contains an error field and an optional error_description field
    private parseAuthorizationServerErrorResponse(text: string): any {

        try {
            const data = JSON.parse(text)
            if (data && typeof data === 'object') {
                return data
            }
        }
        catch (e) {
        }

        return null
    }
}

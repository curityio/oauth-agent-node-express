export interface OauthAgentStartResponse {
    authorizationRequestUrl: string
}

export interface OAuthAgentErrorResponse {
    code: string
}

export interface OAuthAgentClaimsResponse {
    auth_time: number
}

export interface OAuthAgentEndResponse {
    isLoggedIn: boolean
    handled: boolean
    csrf: string
}

export interface OAuthAgentLogoutResponse {
    url: string
}

export interface OAuthAgentUserinfoResponse {
    given_name: string
    family_name: string
}
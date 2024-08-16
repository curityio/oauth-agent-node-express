/*
 *  Copyright 2021 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import {CookieSerializeOptions} from 'cookie'

export default class OAuthAgentConfiguration {

    // Host settings
    public port: string
    public endpointsPrefix: string
    public serverCertPath: string
    public serverCertPassword: string
    
    // Client Configuration
    public clientID: string
    public clientSecret: string
    public redirectUri: string
    public postLogoutRedirectURI: string
    public scope: string

    // Authorization Server settings
    public issuer: string;
    public authorizeEndpoint: string
    public logoutEndpoint: string
    public tokenEndpoint: string
    public userInfoEndpoint: string

    // Secure cookie and CORS configuration
    public cookieNamePrefix: string
    public encKey: string
    public trustedWebOrigin: string
    public cookieOptions: CookieSerializeOptions

    constructor(
        port: string,
        endpointsPrefix: string,
        serverCertPath: string,
        serverCertPassword: string,
        clientID: string,
        clientSecret: string,
        redirectUri: string,
        postLogoutRedirectURI: string,
        scope: string,
        issuer: string,
        authorizeEndpoint: string,
        logoutEndpoint: string,
        tokenEndpoint: string,
        userInfoEndpoint: string,
        cookieNamePrefix: string,
        encKey: string,
        trustedWebOrigin: string,
        cookieOptions?: CookieSerializeOptions) {

        this.port = port
        this.endpointsPrefix = endpointsPrefix
        this.serverCertPath = serverCertPath
        this.serverCertPassword = serverCertPassword

        this.clientID = clientID
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.postLogoutRedirectURI = postLogoutRedirectURI
        this.scope = scope

        this.cookieNamePrefix = cookieNamePrefix ? cookieNamePrefix : "oauthagent"
        this.encKey = encKey
        this.trustedWebOrigin = trustedWebOrigin
        this.cookieOptions = cookieOptions ? cookieOptions : {
            httpOnly: true,
            secure: true,
            sameSite: true
        } as CookieSerializeOptions

        this.issuer = issuer
        this.authorizeEndpoint = authorizeEndpoint
        this.logoutEndpoint = logoutEndpoint
        this.tokenEndpoint = tokenEndpoint
        this.userInfoEndpoint = userInfoEndpoint
    }
}

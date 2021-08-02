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

export default class BFFConfiguration {

    // Client Configuration
    public clientID: string
    public clientSecret: string
    public redirectUri: string
    public postLogoutRedirectURI?: string
    public scope: string

    // Authorization Server Configuration
    public logoutEndpoint: string
    public authorizeEndpoint: string
    public tokenEndpoint: string

    // BFF session cookie and CORS configuration
    public bffEndpointsPrefix: string
    public encKey: string
    public cookieOptions: CookieSerializeOptions
    public cookieNamePrefix: string
    public trustedWebOrigins: string[]

    constructor(
        clientID: string,
        clientSecret: string,
        redirectUri: string,
        scope: string,
        logoutEndpoint: string,
        authorizeEndpoint: string,
        tokenEndpoint: string,
        encKey: string,
        trustedWebOrigins: string[],
        bffEndpointsPrefix: string = '',
        cookieNamePrefix?: string,
        postLogoutRedirectURI?: string,
        cookieOptions?: CookieSerializeOptions) {
        this.clientID = clientID
        this.clientSecret = clientSecret
        this.redirectUri = redirectUri
        this.postLogoutRedirectURI = postLogoutRedirectURI
        this.scope = scope

        this.encKey = encKey
        this.cookieNamePrefix = cookieNamePrefix ? cookieNamePrefix : "bff"
        this.cookieOptions = cookieOptions ? cookieOptions : {
            httpOnly: true,
            secure: true,
            sameSite: true
        } as CookieSerializeOptions

        this.trustedWebOrigins = trustedWebOrigins

        this.logoutEndpoint = logoutEndpoint
        this.authorizeEndpoint = authorizeEndpoint
        this.tokenEndpoint = tokenEndpoint

        this.bffEndpointsPrefix = bffEndpointsPrefix
    }
}

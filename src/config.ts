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

import {OAuthAgentConfiguration} from './lib/index.js'
import {CookieSerializeOptions} from 'cookie'

export const config: OAuthAgentConfiguration = {
    
    // Host settings
    port: process.env.PORT || '8080',
    endpointsPrefix: '/oauth-agent',
    serverCertPath: process.env.SERVER_CERT_P12_PATH || '',
    serverCertPassword: process.env.SERVER_CERT_P12_PASSWORD || '',

    // Client settings
    clientID: process.env.CLIENT_ID || 'spa-client',
    clientSecret: process.env.CLIENT_SECRET || 'Password1',
    redirectUri: process.env.REDIRECT_URI || 'http://www.example.local/',
    postLogoutRedirectURI: process.env.POST_LOGOUT_REDIRECT_URI || 'http://www.example.local/',
    scope: process.env.SCOPE || 'openid profile',

    // Cookie related settings
    cookieNamePrefix: process.env.COOKIE_NAME_PREFIX || 'example',
    encKey: process.env.COOKIE_ENCRYPTION_KEY || '4e4636356d65563e4c73233847503e3b21436e6f7629724950526f4b5e2e4e50',
    trustedWebOrigin: process.env.TRUSTED_WEB_ORIGIN || 'http://www.example.local',
    cookieOptions: {
        httpOnly: true,
        sameSite: true,
        secure: !!process.env.SERVER_CERT_P12_PATH || process.env.COOKIE_SECURE === 'true',
        path: process.env.COOKIE_BASE_PATH || '/',
    } as CookieSerializeOptions,

    // Authorization Server settings
    issuer: process.env.ISSUER || 'http://login.example.local:8443/oauth/v2/oauth-anonymous',
    authorizeEndpoint: process.env.AUTHORIZE_ENDPOINT || 'http://login.example.local:8443/oauth/v2/oauth-authorize',
    logoutEndpoint: process.env.LOGOUT_ENDPOINT || 'http://login.example.local:8443/oauth/v2/oauth-session/logout',
    tokenEndpoint: process.env.TOKEN_ENDPOINT || 'http://login.example.local:8443/oauth/v2/oauth-token',
    userInfoEndpoint: process.env.USERINFO_ENDPOINT || 'http://login.example.local:8443/oauth/v2/oauth-userinfo',
}

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

import type { ClientOptions } from './clientOptions.js'
import OAuthAgentConfiguration from './oauthAgentConfiguration.js'
import { createAuthorizationRequest, handleAuthorizationResponse } from './loginHandler.js'
import { validateIDtoken } from './idTokenValidator.js'
import { getEncryptedCookie, decryptCookie } from './cookieEncrypter.js'
import { getCookiesForTokenResponse, getCookiesForUnset, getCookiesForAccessTokenExpiry, getCookiesForRefreshTokenExpiry } from './cookieBuilder.js'
import { getTokenEndpointResponse, refreshAccessToken } from './getToken.js'
import getUserInfo from './getUserInfo.js'
import getIDTokenClaims from './getIDTokenClaims.js'
import getRedirectUri from './redirectUri.js'
import getLogoutURL from './getLogoutURL.js'
import { getTempLoginDataCookie, getTempLoginDataCookieForUnset, generateRandomString } from './pkce.js'
import { getAuthCookieName, getIDCookieName, getATCookieName, getTempLoginDataCookieName } from './cookieName.js'

export {
    ClientOptions,
    OAuthAgentConfiguration,
    createAuthorizationRequest,
    handleAuthorizationResponse,
    validateIDtoken,
    getEncryptedCookie,
    decryptCookie,
    getTokenEndpointResponse,
    getUserInfo,
    getIDTokenClaims,
    getRedirectUri,
    getLogoutURL,
    refreshAccessToken,
    getCookiesForUnset,
    getCookiesForAccessTokenExpiry,
    getCookiesForRefreshTokenExpiry,
    getTempLoginDataCookieForUnset,
    getTempLoginDataCookie,
    getCookiesForTokenResponse,
    getATCookieName,
    getTempLoginDataCookieName,
    getIDCookieName,
    getAuthCookieName,
    generateRandomString,
};

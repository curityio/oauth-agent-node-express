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

import OAuthAgentConfiguration from './oauthAgentConfiguration'
import { createAuthorizationRequest, handleAuthorizationResponse } from './loginHandler'
import { validateIDtoken } from './idTokenValidator'
import { ClientOptions } from './clientOptions'
import { ValidateRequestOptions } from './validateRequest'
import { getEncryptedCookie, decryptCookie } from './cookieEncrypter'
import { getCookiesForTokenResponse, getCookiesForUnset } from './cookieBuilder'
import { getTokenEndpointResponse, refreshAccessToken } from './getToken'
import getUserInfo from './getUserInfo'
import getIDTokenClaims from './getIDTokenClaims'
import getRedirectUri from './redirectUri'
import getLogoutURL from './getLogoutURL'
import { getTempLoginDataCookie, getTempLoginDataCookieForUnset, generateRandomString } from './pkce'
import { getAuthCookieName, getIDCookieName, getCSRFCookieName, getATCookieName, getTempLoginDataCookieName } from './cookieName'

export {
    OAuthAgentConfiguration,
    ClientOptions,
    ValidateRequestOptions,
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
    getTempLoginDataCookieForUnset,
    getTempLoginDataCookie,
    getCookiesForTokenResponse,
    getATCookieName,
    getTempLoginDataCookieName,
    getCSRFCookieName,
    getIDCookieName,
    getAuthCookieName,
    generateRandomString,
}

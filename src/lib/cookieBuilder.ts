/*
 *  Copyright 2022 Curity AB
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

import {CookieSerializeOptions, serialize} from 'cookie'
import {getEncryptedCookie} from './cookieEncrypter.js'
import OAuthAgentConfiguration from './oauthAgentConfiguration.js'
import {getATCookieName, getAuthCookieName, getCSRFCookieName, getIDCookieName} from './cookieName.js'
import {getTempLoginDataCookieForUnset} from './pkce.js'

const DAY_MILLISECONDS = 1000 * 60 * 60 * 24

function getCookiesForTokenResponse(tokenResponse: any, config: OAuthAgentConfiguration, unsetTempLoginDataCookie: boolean = false, csrfCookieValue?: string): string[] {
    
    const cookies = [
        getEncryptedCookie(config.cookieOptions, tokenResponse.access_token, getATCookieName(config.cookieNamePrefix), config.encKey)
    ]

    if (csrfCookieValue) {
        cookies.push(getEncryptedCookie(config.cookieOptions, csrfCookieValue, getCSRFCookieName(config.cookieNamePrefix), config.encKey))
    }

    if (unsetTempLoginDataCookie) {
        cookies.push(getTempLoginDataCookieForUnset(config.cookieOptions, config.cookieNamePrefix))
    }

    if (tokenResponse.refresh_token) {
        const refreshTokenCookieOptions = {
            ...config.cookieOptions,
            path: config.endpointsPrefix + '/refresh'
        }
        cookies.push(getEncryptedCookie(refreshTokenCookieOptions, tokenResponse.refresh_token, getAuthCookieName(config.cookieNamePrefix), config.encKey))
    }

    if (tokenResponse.id_token) {
        const idTokenCookieOptions = {
            ...config.cookieOptions,
            path: config.endpointsPrefix + '/claims'
        }
        cookies.push(getEncryptedCookie(idTokenCookieOptions, tokenResponse.id_token, getIDCookieName(config.cookieNamePrefix), config.encKey))
    }

    return cookies
}

function getCookiesForUnset(options: CookieSerializeOptions, cookieNamePrefix: string): string[] {

    const cookieOptions = {
        ...options,
        expires: new Date(Date.now() - DAY_MILLISECONDS),
    }

    return [
        serialize(getAuthCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getATCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getIDCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getCSRFCookieName(cookieNamePrefix), "", cookieOptions)
    ]
}

export { getCookiesForTokenResponse, getCookiesForUnset };
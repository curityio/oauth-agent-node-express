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

import fetch from 'node-fetch'
import {decryptCookie} from './cookieEncrypter.js'
import {Grant} from './grant.js'
import OAuthAgentConfiguration from './oauthAgentConfiguration.js'
import {
    OAuthAgentException,
    InvalidCookieException,
    AuthorizationClientException,
    AuthorizationServerException
} from './exceptions/index.js'

async function getUserInfo(config: OAuthAgentConfiguration, encKey: string, encryptedCookie: string): Promise<Object> {

    try {
        let accessToken = null
        try {
            accessToken = decryptCookie(encKey, encryptedCookie)
        } catch (err: any) {
            const error = new InvalidCookieException(err)
            error.logInfo = 'Unable to decrypt the access token cookie to get user info'
            throw error
        }

        const res = await fetch(
            config.userInfoEndpoint,
            {
                method: 'POST',
                headers: {
                    'Authorization': 'Bearer ' + accessToken,
                    'Content-Type': 'application/x-www-form-urlencoded'
                },
            })

        // Read text if it exists
        const text = await res.text()

        if (res.status >= 500) {
            const error = new AuthorizationServerException()
            error.logInfo = `Server error response in a User Info request: ${text}`
            throw error
        }

        if (res.status >= 400) {
            throw new AuthorizationClientException(Grant.UserInfo, res.status, text)
        }

        return JSON.parse(text)

    } catch (err: any) {

        if (!(err instanceof OAuthAgentException)) {
            const error = new AuthorizationServerException(err)
            error.logInfo = 'Connectivity problem during a User Info request'
            throw error
        } else {
            throw err
        }
    }
}

export default getUserInfo

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

import BFFConfiguration from './BFFConfiguration'
import {generateHash, generateRandomString} from './pkce'

function getAuthorizationURL(config: BFFConfiguration): AuthorizationRequestData {
    const codeVerifier = generateRandomString()
    const state = generateRandomString()

    let authorizationRequestUrl = config.authorizeEndpoint + "?" +
        "client_id=" + encodeURIComponent(config.clientID) +
        "&state=" + encodeURIComponent(state) +
        "&response_type=code" +
        "&redirect_uri=" + encodeURIComponent(config.redirectUri) +
        "&code_challenge=" + generateHash(codeVerifier) +
        "&code_challenge_method=S256"

    if (config.scope) {
        authorizationRequestUrl += "&scope=" + encodeURIComponent(config.scope)
    }

    return new AuthorizationRequestData(authorizationRequestUrl, codeVerifier, state)
}

class AuthorizationRequestData {
    public readonly authorizationRequestURL: string
    public readonly codeVerifier: string
    public readonly state: string

    constructor(authorizationRequestURL: string, codeVerifier: string, state: string) {
        this.authorizationRequestURL = authorizationRequestURL
        this.codeVerifier = codeVerifier
        this.state = state
    }
}

export { getAuthorizationURL }

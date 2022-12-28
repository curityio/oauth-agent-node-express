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

import {ClientOptions} from '../../clientOptions';
import OAuthAgentConfiguration from '../../oauthAgentConfiguration';
import {generateHash, generateRandomString} from '../../pkce';
import {AuthorizationRequestHandler} from './authorizationRequestHandler';
import {AuthorizationRequestData} from './authorizationRequestData';

/*
 * Return a standard PKCE URL for an OpenID Connect code flow 
 */
export class DefaultAuthorizationRequestHandler implements AuthorizationRequestHandler {

    private readonly config: OAuthAgentConfiguration;

    constructor(config: OAuthAgentConfiguration) {
        this.config = config;
    }
    
    public async createRequest(options?: ClientOptions): Promise<AuthorizationRequestData> {

        const codeVerifier = generateRandomString()
        const state = generateRandomString()

        let authorizationRequestUrl = this.config.authorizeEndpoint + "?" +
            "client_id=" + encodeURIComponent(this.config.clientID) +
            "&redirect_uri=" + encodeURIComponent(this.config.redirectUri) +
            "&response_type=code" +
            "&state=" + encodeURIComponent(state) +
            "&code_challenge=" + generateHash(codeVerifier) +
            "&code_challenge_method=S256"

        if (options && options.extraParams) {
            options.extraParams.forEach((p) => {
                if (p.key && p.value) {
                    authorizationRequestUrl += `&${p.key}=${encodeURIComponent(p.value)}`
                }
            });
        }

        if (this.config.scope) {
            authorizationRequestUrl += "&scope=" + encodeURIComponent(this.config.scope)
        }

        return new AuthorizationRequestData(authorizationRequestUrl, codeVerifier, state)
    }
}

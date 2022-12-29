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

import OAuthAgentConfiguration from '../oauthAgentConfiguration'
import {AuthorizationRequestHandler} from './authorizationRequest/authorizationRequestHandler'
import {AuthorizationResponseHandler} from './authorizationResponse/authorizationResponseHandler'
import {DefaultAuthorizationRequestHandler} from './authorizationRequest/defaultAuthorizationRequestHandler'
import {DefaultAuthorizationResponseHandler} from './authorizationResponse/defaultAuthorizationResponseHandler'

/*
 * The factory could create different implementations based on configuration
 */
export class OAuthFactory {

    private readonly config: OAuthAgentConfiguration;

    constructor(config: OAuthAgentConfiguration) {
        this.config = config;
    }

    public createAuthorizationRequestHandler(): AuthorizationRequestHandler {
        return new DefaultAuthorizationRequestHandler(this.config)
    }

    public createAuthorizationResponseHandler() : AuthorizationResponseHandler {
        return new DefaultAuthorizationResponseHandler()
    }
}

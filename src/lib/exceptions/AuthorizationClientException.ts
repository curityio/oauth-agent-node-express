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

import OAuthAgentException from './OAuthAgentException.js'
import {Grant} from '../grant.js'

export default class AuthorizationClientException extends OAuthAgentException {
    
    // By default assume a configuration error
    public statusCode = 400
    public code = 'authorization_error'

    constructor(grant: Grant, status: number, responseText: string) {
        super('A request sent to the Authorization Server was rejected')

        // User info requests can be caused by expiry, in which case inform the SPA so that it can avoid an error display
        if (grant === Grant.UserInfo && status == 401) {
            this.code = 'token_expired'
            this.statusCode = 401
        }

        // Refresh tokens will expire eventually, in which case inform the SPA so that it can avoid an error display
        if (grant === Grant.RefreshToken && responseText.indexOf('invalid_grant') !== -1) {
            this.code = 'session_expired'
            this.statusCode = 401
        }

        this.logInfo = `${Grant[grant]} request failed with status: ${status} and response: ${responseText}`
    }
}

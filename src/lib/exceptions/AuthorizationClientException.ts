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

import OAuthAgentException from './OAuthAgentException'

export default class AuthorizationClientException extends OAuthAgentException {
    
    // By default the SPA will present an error when the Authorization Server returns an
    public statusCode = 400
    public code = 'authorization_error'
    public description = ''

    constructor() {
        super('A request sent to the Authorization Server was rejected')
    }

    // User info requests can fail, in which case inform the SPA so that it can avoid an error display
    public onUserInfoFailed(status: number) {

        if (status == 401) {

            this.code = 'token_expired'
            this.statusCode = 401
        }
    }

    // Token refresh will fail eventually, in which case inform the SPA so that it can avoid an error display
    public onTokenRefreshFailed(text: string) {

        if (text.indexOf('invalid_grant') !== -1) {

            this.code = 'session_expired'
            this.statusCode = 401
        }
    }
}

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

import OAuthAgentException from './OAuthAgentException.js'

export default class AuthorizationServerException extends OAuthAgentException {
    public statusCode = 502
    public code = 'authorization_server_error'
    public cause?: Error

    constructor(cause?: Error) {
        super('A problem occurred with a request to the Authorization Server')
        this.cause = cause
    }
}

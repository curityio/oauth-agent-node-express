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

import {AuthorizationResponseHandler} from './authorizationResponseHandler';
import {AuthorizationResponseException} from '../../exceptions'
import * as urlparse from 'url-parse'

/*
 * Handles a code flow authorization response with response_mode=query, to receive the code and state
 */
export class DefaultAuthorizationResponseHandler implements AuthorizationResponseHandler {
    
    public async handleResponse(pageUrl?: string): Promise<any> {

        const data = this.getUrlParts(pageUrl)

        if (data.state && data.code) {

            return {
                code: data.code,
                state: data.state,
            }
        }

        if (data.state && data.error) {

            throw new AuthorizationResponseException(
                data.error,
                data.error_description || 'Login failed at the Authorization Server')
        }

        return {
            code: null,
            state: null,
        }
    }

    getUrlParts(url?: string): any {
        
        if (url) {
            const urlData = urlparse(url, true)
            if (urlData.query) {
                return urlData.query
            }
        }

        return {}
    }
}

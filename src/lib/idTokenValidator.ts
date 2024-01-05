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

import {decodeJwt} from 'jose';
import {InvalidIDTokenException} from './exceptions/index.js';
import OAuthAgentConfiguration from './oauthAgentConfiguration.js';

/*
 * Make some sanity checks to ensure that the issuer and audience are configured correctly
 * The ID token is received over a trusted back channel connection so its signature does not need verifying
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 */
export function validateIDtoken(config: OAuthAgentConfiguration, idToken: string) {

    // For backwards compatibility, only validate the issuer when one is configured
    if (process.env.ISSUER) {
    
        const payload = decodeJwt(idToken)
        
        if (payload.iss !== config.issuer) {
            throw new InvalidIDTokenException(new Error('Unexpected iss claim'))
        }

        const audience = getAudienceClaim(payload.aud)
        if (audience.indexOf(config.clientID) === -1) {
            throw new InvalidIDTokenException(new Error('Unexpected aud claim'))
        }
    }
}

function getAudienceClaim(aud: any): string[] {

    if (typeof aud === 'string') {
        return [aud]
    }

    if (Array.isArray(aud)) {
        return aud
    }

    return []
}

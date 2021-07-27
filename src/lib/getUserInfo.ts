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

import {decryptCookie} from './cookieEncrypter'
import {InvalidBFFCookieException, InvalidIDTokenException} from './exceptions'

function getUserInfo(encKey: string, encryptedCookie: string): Object {
    let idToken = null

    try {
        idToken = decryptCookie(encKey, encryptedCookie)
    } catch (err) {
        // error while decrypting or parsing cookie value
        throw new InvalidBFFCookieException(err)
    }

    const tokenParts = idToken.split('.')

    if (tokenParts.length !== 3) {
        throw new InvalidIDTokenException()
    }

    // TODO this should properly verify id token
    // TODO - what to do when id token is expired or missing? Call userinfo endpoint? It may have different data than the id token
    try {
        return JSON.parse(String(Buffer.from(tokenParts[1], 'base64').toString('binary')));
    } catch (err) {
        throw new InvalidIDTokenException(err)
    }
}

export default getUserInfo

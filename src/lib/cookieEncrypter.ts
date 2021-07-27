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

import * as crypto from 'crypto'
import {CookieSerializeOptions, serialize} from 'cookie'
import {getATCookieName, getAuthCookieName, getCSRFCookieName, getIDCookieName} from './cookieName'

const DAY_MILLISECONDS = 1000 * 60 * 60 * 24

function decryptCookie(encKey: string, value: string): string {
    const encryptedArray = value.split(':')
    const iv = Buffer.from(encryptedArray[0], 'hex')
    const encrypted = encryptedArray[1]
    const decipher = crypto.createDecipheriv('aes256', encKey, iv)
    return decipher.update(encrypted, 'hex', 'utf8') + decipher.final('utf8')
}

function encryptCookie(encKey: string, value: string): string {
    const iv = crypto.randomBytes(16)
    const cipher = crypto.createCipheriv(
        'aes256',
        encKey,
        iv
    )
    const encrypted = [
        iv.toString('hex'),
        ':',
        cipher.update(value, 'utf8', 'hex'),
        cipher.final('hex')
    ]

    return encrypted.join('')
}

function getEncryptedCookie(options: CookieSerializeOptions, value: string, name: string, encKey: string): string {
    return serialize(name, encryptCookie(encKey, value), options)
}

function getCookiesForUnset(options: CookieSerializeOptions, cookieNamePrefix: string): string[] {
    const cookieOptions = {
        ...options,
        expires: new Date(Date.now() - DAY_MILLISECONDS),
    }

    return [
        serialize(getAuthCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getATCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getIDCookieName(cookieNamePrefix), "", cookieOptions),
        serialize(getCSRFCookieName(cookieNamePrefix), "", cookieOptions)
    ]
}

export { getEncryptedCookie, decryptCookie, getCookiesForUnset, encryptCookie };

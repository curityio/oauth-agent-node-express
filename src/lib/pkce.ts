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

import crypto from 'crypto'
import {SerializeOptions, serialize} from 'cookie'
import {getTempLoginDataCookieName} from './cookieName.js'
import {encryptCookie} from './cookieEncrypter.js'

const VALID_CHARS = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789'
const DAY_MILLISECONDS = 1000 * 60 * 60 * 24

function generateRandomString(length = 64): string {
    const array = new Uint8Array(length)
    crypto.randomFillSync(array)
    const mappedArray = array.map(x => VALID_CHARS.charCodeAt(x % VALID_CHARS.length))
    return String.fromCharCode.apply(null, [...mappedArray])
}

function generateHash(data: string): string {
    const hash = crypto.createHash('sha256')
    hash.update(data)
    const hashedData = hash.digest('base64')

    return base64UrlEncode(hashedData)
}

function base64UrlEncode(hashedData: string): string {
    return hashedData
        .replace(/=/g, '')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
}

function getTempLoginDataCookie(codeVerifier: string, state: string, options: SerializeOptions, cookieNamePrefix: string, encKey: string): string {
    return serialize(getTempLoginDataCookieName(cookieNamePrefix), encryptCookie(encKey, JSON.stringify({ codeVerifier, state })), options)
}

function getTempLoginDataCookieForUnset(options: SerializeOptions, cookieNamePrefix: string): string {
    const cookieOptions = {
        ...options,
        expires: new Date(Date.now() - DAY_MILLISECONDS)
    }

    return serialize(getTempLoginDataCookieName(cookieNamePrefix), "", cookieOptions)
}

export {generateHash, generateRandomString, getTempLoginDataCookie, getTempLoginDataCookieForUnset}

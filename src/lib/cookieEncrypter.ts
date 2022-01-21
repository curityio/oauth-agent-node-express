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
import base64url from 'base64url';
import {CookieSerializeOptions, serialize} from 'cookie'
import {getATCookieName, getAuthCookieName, getCSRFCookieName, getIDCookieName} from './cookieName'

const VERSION_SIZE = 1;
const GCM_IV_SIZE = 12;
const GCM_TAG_SIZE = 16;
const CURRENT_VERSION = 1;
const DAY_MILLISECONDS = 1000 * 60 * 60 * 24

function encryptCookie(encKeyHex: string, plaintext: string): string {
    
    const ivBytes = crypto.randomBytes(GCM_IV_SIZE)
    const encKeyBytes = Buffer.from(encKeyHex, "hex")

    const cipher = crypto.createCipheriv("aes-256-gcm", encKeyBytes, ivBytes)

    const encryptedBytes = cipher.update(plaintext)
    const finalBytes = cipher.final()
    
    const versionBytes = Buffer.from(new Uint8Array([CURRENT_VERSION]))
    const ciphertextBytes = Buffer.concat([encryptedBytes, finalBytes])
    const tagBytes = cipher.getAuthTag()
    
    const allBytes = Buffer.concat([versionBytes, ivBytes, ciphertextBytes, tagBytes])

    return base64url.encode(allBytes)
}

function decryptCookie(encKeyHex: string, encryptedbase64value: string): string {
    
    const allBytes = base64url.toBuffer(encryptedbase64value)

    const minSize = VERSION_SIZE + GCM_IV_SIZE + 1 + GCM_TAG_SIZE
    if (allBytes.length < minSize) {
        throw new Error("The received cookie has an invalid length")
    }

    const version = allBytes[0]
    if (version != CURRENT_VERSION) {
        throw new Error("The received cookie has an invalid format")
    }

    let offset = VERSION_SIZE
    const ivBytes = allBytes.slice(offset, offset + GCM_IV_SIZE)

    offset += GCM_IV_SIZE
    const ciphertextBytes = allBytes.slice(offset, allBytes.length - GCM_TAG_SIZE)

    offset = allBytes.length - GCM_TAG_SIZE
    const tagBytes = allBytes.slice(offset, allBytes.length)

    const encKeyBytes = Buffer.from(encKeyHex, "hex")
    const decipher = crypto.createDecipheriv('aes-256-gcm', encKeyBytes, ivBytes)
    decipher.setAuthTag(tagBytes)

    const plaintextBytes = Buffer.concat([decipher.update(ciphertextBytes), decipher.final()])
    return plaintextBytes.toString();
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

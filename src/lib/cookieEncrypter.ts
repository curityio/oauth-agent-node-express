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
import base64url from 'base64url';
import {SerializeOptions, serialize} from 'cookie'
import {CookieDecryptionException, InvalidCookieException} from '../lib/exceptions/index.js'

const VERSION_SIZE = 1;
const GCM_IV_SIZE = 12;
const GCM_TAG_SIZE = 16;
const CURRENT_VERSION = 1;

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
        const error = new Error("The received cookie has an invalid length")
        throw new InvalidCookieException(error)
    }

    const version = allBytes[0]
    if (version != CURRENT_VERSION) {
        const error = new Error("The received cookie has an invalid format")
        throw new InvalidCookieException(error)
    }

    let offset = VERSION_SIZE
    const ivBytes = allBytes.slice(offset, offset + GCM_IV_SIZE)

    offset += GCM_IV_SIZE
    const ciphertextBytes = allBytes.slice(offset, allBytes.length - GCM_TAG_SIZE)

    offset = allBytes.length - GCM_TAG_SIZE
    const tagBytes = allBytes.slice(offset, allBytes.length)

    try {
    
        const encKeyBytes = Buffer.from(encKeyHex, "hex")
        const decipher = crypto.createDecipheriv('aes-256-gcm', encKeyBytes, ivBytes)
        decipher.setAuthTag(tagBytes)

        const decryptedBytes = decipher.update(ciphertextBytes)
        const finalBytes = decipher.final()
        
        const plaintextBytes = Buffer.concat([decryptedBytes, finalBytes])
        return plaintextBytes.toString()

    } catch(e: any) {

        throw new CookieDecryptionException(e)
    }
}

function getEncryptedCookie(options: SerializeOptions, value: string, name: string, encKey: string): string {
    return serialize(name, encryptCookie(encKey, value), options)
}

export { getEncryptedCookie, decryptCookie, encryptCookie };

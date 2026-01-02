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

export class Base64Url {

    public static encode(input: Buffer): string {

        return input.toString('base64')
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=+$/g, '')
    }

    public static decode(input: string): Buffer {

        const base64 = input
            .replace(/-/g, '+')
            .replace(/_/g, '/')

        return Buffer.from(base64, 'base64')
    }

    public static decodeToString(input: string): string {
        return Base64Url.decode(input).toString()
    }
}

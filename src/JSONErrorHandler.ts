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

import * as express from 'express'
import {BFFException} from './lib/exceptions'

export default async function jsonErrorHandler(err: Error, req: express.Request, res: express.Response, next: express.NextFunction) {
    let statusCode = 500
    let data = { error: 'server_error', error_description: 'A problem was encountered - see BFF API logs' }

    // TODO - this should be properly logged
    console.log(err)

    if (err instanceof BFFException) {
        statusCode = err.statusCode
        data = { error: err.code, error_description: err.message}
    }

    res.status(statusCode).send(data)
}

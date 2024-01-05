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

import {Request, Response} from 'express'
import {OAuthAgentException} from '../lib/exceptions/index.js';

export class RequestLog {

    private time?: string
    private method?: string
    private path?: string
    private status?: number
    private error?: OAuthAgentException

    public start(request: Request) {

        this.time = new Date().toUTCString()
        this.method = request.method
        this.path = request.originalUrl
    }

    public addError(error: OAuthAgentException) {
        this.error = error
    }

    public end(response: Response) {

        this.status = response.statusCode
        this._output()
    }

    private _output() {

        // Only output log details when there is an error
        if (this.status && this.status >= 400) {

            let stack = ''
            let logInfo = ''
            if (this.error) {
                
                logInfo = this.error.logInfo
                if (this.error.stack) {
                    stack = this.error.stack
                }

                const cause = (this.error as any).cause
                if (cause) {

                    if (cause.message) {
                        logInfo += `, ${cause.message}`
                    }
                    if (cause.logInfo) {
                        logInfo += `, ${cause.logInfo}`
                    }
                    if (cause.stack) {
                        stack = cause.stack
                    }
                }
            }
            
            let fields: string[] = []
            this._addField(fields, this.time)
            this._addField(fields, this.method)
            this._addField(fields, this.path)
            this._addField(fields, this.status?.toString())
            this._addField(fields, this.error?.code)
            this._addField(fields, this.error?.message)
            this._addField(fields, logInfo)

            // Only include a stack trace when there is a 500 error
            if (this.status && this.status >= 500 && stack) {
                this._addField(fields, stack)
            }

            console.log(fields.join(', '))
        }
    }

    private _addField(fields: string[], value?: string) {

        if (value) {
            fields.push(value)
        }
    }
}

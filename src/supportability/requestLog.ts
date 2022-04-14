import {Request, Response} from 'express'
import {OAuthAgentException} from '../lib/exceptions';

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

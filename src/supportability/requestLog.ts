import {Request, Response} from 'express'
import {BFFException} from '../lib/exceptions';

export class RequestLog {

    private time?: string
    private method?: string
    private path?: string
    private status?: number
    private errorCode?: string
    private errorMessage?: string
    private errorDetails?: string
    private errorStack?: string

    public start(request: Request) {

        this.time = new Date().toUTCString()
        this.method = request.method,
        this.path = request.path
    }

    public setError(error: BFFException) {
        
        this.errorCode = error.code
        this.errorMessage = error.message
        if (error.logInfo) {
            this.errorDetails = error.logInfo
        }
        if (error.stack) {
            this.errorStack = error.stack
        }

        const cause = (error as any).cause
        if (cause) {

            if (cause.message) {
                this.errorDetails += `, ${cause.message}`
            }
            if (cause.stack) {
                this.errorStack = cause.errorStack
            }
        }
    }

    public setException(error: any, errorCode: any) {

        this.errorCode = errorCode
        if (error.message) {
            this.errorMessage = error.message
        }
        if (error.stack) {
            this.errorStack = error.stack
        }
    }

    public end(response: Response) {

        this.status = response.statusCode
        this._output()
    }

    private _output() {

        let fields = []
        this._addField(fields, 'Time', this.time)
        this._addField(fields, 'Method', this.method)
        this._addField(fields, 'Path', this.path)
        this._addField(fields, 'Status', this.status.toString())
        this._addField(fields, 'ErrorCode', this.errorCode)
        this._addField(fields, 'Message', this.errorMessage)
        this._addField(fields, 'Details', this.errorDetails)
        console.log(fields.join(', '))

        if (this.status >= 500 && this.errorStack) {
            console.log('*** OUTPUT STACK TRACE')
            console.log(this.errorStack)
        }
    }

    private _addField(fields: string[], name: string, value?: string) {

        if (value) {
            fields.push(`${name}: ${value}`)
        }
    }
}

import {Request, Response} from 'express'
import {BFFException} from '../lib/exceptions';

export class RequestLog {

    private time?: string
    private method?: string
    private path?: string
    private status?: number
    private errorCode?: string
    private errorMessage?: string
    private errorStack?: string

    public start(request: Request) {

        this.time = new Date().toUTCString()
        this.method = request.method,
        this.path = request.path
    }

    public setError(error: BFFException) {
        
        this.errorCode = error.code
        this.errorMessage = error.message
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
        fields.push(this._getField('Time', this.time))
        fields.push(this._getField('Method', this.method))
        fields.push(this._getField('Path', this.path))
        fields.push(this._getField('Status', this.status.toString()))
        fields.push(this._getField('ErrorCode', this.errorCode))
        fields.push(this._getField('Detail', this.errorMessage))
        console.log(fields.join(', '))

        if (this.status >= 500 && this.errorStack) {
            console.log(this.errorStack)
        }
    }

    private _getField(name: string, value?: string): string {

        if (value) {
            return `${name}: ${value}`
        }

        return '';
    }
}

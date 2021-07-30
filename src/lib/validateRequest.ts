import {UnauthorizedException} from './exceptions'
import {decryptCookie} from './cookieEncrypter'

export default function validateRequest(data: ValidateRequestData, options: ValidateRequestOptions) {

    if (options.requireTrustedOrigin) {
        if (data.allowedOrigins.findIndex((value) => value === data.originHeader) == -1) {
            
            const error = new UnauthorizedException()
            error.logInfo = 'The call is from an untrusted web origin'
            throw error
        }
    }

    if (options.requireCsrfHeader) {

        if (data.csrfCookie) {
            const decryptedCookie = decryptCookie(data.encKey, data.csrfCookie)
            if (decryptedCookie !== data.csrfHeader) {

                const error = new UnauthorizedException()
                error.logInfo = 'The CSRF header did not match the CSRF cookie in a POST request'
                throw error
            }
        } else {

            const error = new UnauthorizedException()
            error.logInfo = 'No CSRF cookie was supplied in a POST request'
            throw error
        }
    }
}

// Data to validate
export class ValidateRequestData {
    public csrfHeader?: string
    public csrfCookie?: string
    public originHeader?: string
    public allowedOrigins: string[]
    public encKey: string

    public constructor(
        csrfHeader: string | undefined,
        csrfCookie: string | undefined,
        originHeader: string | undefined,
        allowedOrigins: string[],
        encKey: string) {

        this.csrfHeader = csrfHeader
        this.csrfCookie = csrfCookie
        this.originHeader = originHeader
        this.allowedOrigins = allowedOrigins
        this.encKey = encKey
    }
}

// Specific API operations can indicate which validation they need
export class ValidateRequestOptions {

    public requireTrustedOrigin: boolean
    public requireCsrfHeader: boolean
    
    public constructor() {
        this.requireTrustedOrigin = true
        this.requireCsrfHeader = true
    }
}

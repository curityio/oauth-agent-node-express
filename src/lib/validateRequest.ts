import {InvalidRequestException} from './exceptions'
import {decryptCookie} from './cookieEncrypter'

export default function validateRequest(csrfHeader: string | undefined, csrfCookie: string | undefined, originHeader: string | undefined, allowedOrigins: string[], encKey: string) {
    
    // GJA. I would more clearly include the cause of the exception for logging purposes
    if (allowedOrigins.findIndex((value) => value === originHeader) == -1) {
        throw new InvalidRequestException()
    }

    if (csrfCookie) {
        const decryptedCookie = decryptCookie(encKey, csrfCookie)
        if (decryptedCookie !== csrfHeader) {
            throw new InvalidRequestException()
        }
    } else {
        throw new InvalidRequestException()
    }
}

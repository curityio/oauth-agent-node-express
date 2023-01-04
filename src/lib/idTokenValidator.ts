import * as jose from 'jose';
import {InvalidIDTokenException} from './exceptions';
import OAuthAgentConfiguration from './oauthAgentConfiguration';

/*
 * Make some sanity checks to ensure that the issuer and audience are configured correctly
 * The ID token is received over a trusted back channel connection so its signature does not need verifying
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 */
export function validateIDtoken(config: OAuthAgentConfiguration, idToken: string) {

    const payload = jose.decodeJwt(idToken)
    
    if (payload.iss !== config.issuer) {
        throw new InvalidIDTokenException(new Error('Unexpected iss claim'))
    }

    const audience = getAudienceClaim(payload.aud)
    if (audience.indexOf(config.clientID) === -1) {
        throw new InvalidIDTokenException(new Error('Unexpected aud claim'))
    }
}

function getAudienceClaim(aud: any): string[] {

    if (typeof aud === 'string') {
        return [aud]
    }

    if (Array.isArray(aud)) {
        return aud
    }

    return []
}

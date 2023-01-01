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

    const audience = typeof payload.aud === 'string' ? [payload.aud] : payload.aud as string[]
    if (audience.indexOf(config.clientID) === -1) {
        throw new InvalidIDTokenException(new Error('Unexpected aud claim'))
    }

    if (audience.length > 1 || payload.azp) {
        if (payload.azp !== config.clientID) {
            throw new InvalidIDTokenException(new Error('Unexpected azp claim'));
        }
    }
}

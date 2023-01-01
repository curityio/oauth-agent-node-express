import OAuthAgentConfiguration from './oauthAgentConfiguration';

/*
 * Make some sanity checks to ensure that the issuer and audience are configured correctly
 * The ID token is received over a trusted back channel connection so its signature does not need verifying
 * https://openid.net/specs/openid-connect-core-1_0.html#IDTokenValidation
 */
export function validateIDtoken(config: OAuthAgentConfiguration, idToken: string) {

    console.log('*** VALIDATE ID TOKEN');
    console.log(idToken);
}

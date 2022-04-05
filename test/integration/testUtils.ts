import fetch from 'node-fetch';
import * as setCookie from 'set-cookie-parser';
import * as urlParse from 'url-parse';
import {config} from '../../src/config';

const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

/*
 * Get the temp cookie needed to end a login and get final cookies
 */
export async function getTempLoginData(): Promise<[string, setCookie.Cookie]> {

    const response = await fetch(
        `${oauthAgentBaseUrl}/login/start`,
        {
            method: 'POST',
            headers: {
                origin: config.trustedWebOrigins[0],
            },
        },
    )

    const body = await response.json();
    const parsedUrl = urlParse(body.authorizationRequestUrl, true)
    const state = parsedUrl.query.state
    
    const rawCookies = response.headers.raw()['set-cookie']
    const cookies = setCookie.parse(rawCookies)
    return [state!, cookies[0]]
}

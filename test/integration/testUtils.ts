import fetch, {RequestInit} from 'node-fetch';
import * as setCookie from 'set-cookie-parser';
import * as urlParse from 'url-parse';
import {config} from '../../src/config';

const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`

/*
 * Do the work to start a login and get the temp cookie
 */
export async function startLogin(): Promise<[string, string]> {

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
    const loginCookie = cookies[0];

    const cookieString = `${loginCookie.name}=${loginCookie.value}`
    return [state!, cookieString]
}

/*
 * Do a complete login, including ending the login and getting cookies
 */
export async function performLogin(): Promise<[number, any, string]> {

    const [state, loginCookieString] = await startLogin()
    const code = '4a4246d6-b4bd-11ec-b909-0242ac120002'
    const payload = {
        pageUrl: `${oauthAgentBaseUrl}?code=${code}&state=${state}`
    }
    
    const options = {
        method: 'POST',
        headers: {
            origin: config.trustedWebOrigins[0],
            'Content-Type': 'application/json',
            cookie: loginCookieString,
        },
        body: JSON.stringify(payload),
    } as RequestInit

    const response = await fetch(`${oauthAgentBaseUrl}/login/end`, options)
    const body = await response.json()

    const rawCookies = response.headers.raw()['set-cookie']
    const cookies = setCookie.parse(rawCookies)
    
    let allCookiesString = '';
    cookies.forEach((c) => {
        allCookiesString += `${c.name}=${c.value};`
    })

    return [response.status, body, allCookiesString]
}
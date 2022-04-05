
import fetch, {RequestInit, Response} from 'node-fetch';
import * as setCookie from 'set-cookie-parser';
import * as urlParse from 'url-parse';
import {config} from '../../src/config';

const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`
const wiremockAdminBaseUrl = `http://localhost:8443/__admin/mappings`

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
    
    const cookieString = getCookieString(response)
    return [state!, cookieString]
}

/*
 * Do a complete login, including ending the login and getting cookies
 */
export async function performLogin(stateOverride: string = ''): Promise<[number, any, string]> {

    const [state, loginCookieString] = await startLogin()
    const code = '4a4246d6-b4bd-11ec-b909-0242ac120002'
    const payload = {
        pageUrl: `${oauthAgentBaseUrl}?code=${code}&state=${stateOverride || state}`
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

    const cookieString = getCookieString(response)
    return [response.status, body, cookieString]
}

/*
 * Get a response cookie in the form where it can be sent in subsequent requests
 */
export function getCookieString(response: Response) {

    const rawCookies = response.headers.raw()['set-cookie']
    const cookies = setCookie.parse(rawCookies)
    
    let allCookiesString = '';
    cookies.forEach((c) => {
        allCookiesString += `${c.name}=${c.value};`
    })

    return allCookiesString
}

/*
 * Add a stubbed response to Wiremock via its Admin API
 */
export async function addStub(wiremockData: any): Promise<void> {

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(wiremockData),
    } as RequestInit

    const response = await fetch(wiremockAdminBaseUrl, options)
    if (response.status !== 201) {
        const responseData = await response.text()
        console.log(responseData)
        throw new Error('Failed to add Wiremock stub')
    }
}

/*
 * Delete a stubbed response to Wiremock via its Admin API
 */
export async function deleteStub(id: string): Promise<void> {

    const response = await fetch(`${wiremockAdminBaseUrl}/${id}`, {method: 'DELETE'})
    if (response.status !== 200) {
        const responseData = await response.text()
        console.log(responseData)
        throw new Error('Failed to delete Wiremock stub')
    }
}
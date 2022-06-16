
import fetch, {RequestInit, Response} from 'node-fetch';
import * as setCookie from 'set-cookie-parser';
import * as urlParse from 'url-parse';
import {config} from '../../src/config';
import { ClientOptions } from '../../src/lib/clientOptions';

const oauthAgentBaseUrl = `http://localhost:${config.port}${config.endpointsPrefix}`
const wiremockAdminBaseUrl = `http://localhost:8443/__admin/mappings`

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
 * Do a fetch with a stubbed response, dealing with adding the stub to wiremock and then deleting it
 */
export async function fetchStubbedResponse(stubbedResponse: any, fetchAction: () => Promise<any>): Promise<any> {

    try {
        await addStub(stubbedResponse)
        return await fetchAction()

    } finally {
        await deleteStub(stubbedResponse.id)
    }
}

/*
 * Do the work to start a login and get the temp cookie
 */
export async function startLogin(clientOptions: ClientOptions | null = null): Promise<[string, string]> {

    const requestOptions = {
        method: 'POST',
        headers: {
            origin: config.trustedWebOrigins[0],
        },
    } as RequestInit

    if (clientOptions) {
        requestOptions.body = JSON.stringify(clientOptions)
    }

    const response = await fetch(`${oauthAgentBaseUrl}/login/start`, requestOptions)

    const body = await response.json();
    const parsedUrl = urlParse(body.authorizationRequestUrl, true)
    const state = parsedUrl.query.state
    
    const cookieString = getCookieString(response)
    return [state!, cookieString]
}

/*
 * Add a stubbed response to Wiremock via its Admin API
 */
async function addStub(stubbedResponse: any): Promise<void> {

    const options = {
        method: 'POST',
        headers: {
            'Content-Type': 'application/json',
        },
        body: JSON.stringify(stubbedResponse),
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
async function deleteStub(id: string): Promise<void> {

    const response = await fetch(`${wiremockAdminBaseUrl}/${id}`, {method: 'DELETE'})
    if (response.status !== 200) {
        const responseData = await response.text()
        console.log(responseData)
        throw new Error('Failed to delete Wiremock stub')
    }
}
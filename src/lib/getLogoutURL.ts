/*
 *  Copyright 2021 Curity AB
 *
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *
 *      http://www.apache.org/licenses/LICENSE-2.0
 *
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import OAuthAgentConfiguration from './oauthAgentConfiguration.js'

function getLogoutURL(config: OAuthAgentConfiguration): string {
    
    const postLogoutUriFieldName = config.issuer.indexOf('cognito') !== -1 ? 'logout_uri' : 'post_logout_redirect_uri';
    const postLogoutUrlPart = config.postLogoutRedirectURI ? `&${postLogoutUriFieldName}=` + encodeURIComponent(config.postLogoutRedirectURI) : ""
    return config.logoutEndpoint + "?client_id=" + encodeURIComponent(config.clientID) + postLogoutUrlPart
}

export default getLogoutURL

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

import * as express from 'express'
import * as cors from 'cors'
import * as cookieParser from 'cookie-parser'
import {
    LoginController,
    UserInfoController,
    LogoutController,
    RefreshTokenController
} from './controller'
import {config} from './config'
import loggingMiddleware from './supportability/loggingMiddleware';
import exceptionMiddleware from './supportability/exceptionMiddleware';

const app = express()
const port = process.env.PORT ? process.env.PORT: 8080

const corsConfiguration = {
    origin: config.trustedWebOrigins,
    credentials: true,
    methods: ['POST']
}

app.use(cors(corsConfiguration))
app.use(cookieParser())
app.use('*', express.json())
app.use('*', loggingMiddleware);
app.use('*', exceptionMiddleware);
app.set('etag', false)

const controllers = {
    '/login': new LoginController(),
    '/userInfo': new UserInfoController(),
    '/logout': new LogoutController(),
    '/refresh': new RefreshTokenController()
}

for (const [path, controller] of Object.entries(controllers)) {
    app.use(config.bffEndpointsPrefix + path, controller.router)
}

const server = app.listen(port, function() {
    console.log("BFF API is listening on port " + port)
})

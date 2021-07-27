FROM node:15.11.0-alpine

WORKDIR /usr/bff-api
COPY src                 /usr/bff-api/src
COPY tsconfig.json       /usr/bff-api/
COPY package*.json       /usr/bff-api/

# Currently I am running source directly via ts-node
# Discuss with Michal whether webpack should build to a dist folder
# RUN npm install --production
RUN npm install

RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser

USER apiuser
CMD ["./node_modules/.bin/ts-node", "src/server.ts"]
FROM node:15.11.0-alpine

WORKDIR /usr/bff-api
COPY src                 /usr/bff-api/src
COPY tsconfig.json       /usr/bff-api/
COPY package*.json       /usr/bff-api/

RUN npm install --production

RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser

USER apiuser
CMD ["node", "dist/server.js"]
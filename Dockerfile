FROM node:15.11.0-alpine

WORKDIR /usr/token-handler-api
COPY dist                /usr/token-handler-api/dist
COPY package*.json       /usr/token-handler-api/

RUN npm install --production

RUN addgroup -g 1001 apigroup
RUN adduser -u 1001 -G apigroup -h /home/apiuser -D apiuser

USER apiuser
CMD ["node", "dist/server.js"]
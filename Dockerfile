FROM node:18.1.0-bullseye

WORKDIR /usr/oauth-agent
COPY dist                /usr/oauth-agent/dist
COPY package*.json       /usr/oauth-agent/

RUN npm install --production

RUN adduser --disabled-password --home /home/apiuser --gecos '' apiuser
USER apiuser

CMD ["node", "dist/server.js"]
FROM node:18-bullseye

WORKDIR /usr/oauth-agent
COPY dist                /usr/oauth-agent/dist
COPY package*.json       /usr/oauth-agent/

RUN npm install --production

RUN adduser --disabled-password --home /home/apiuser --gecos '' apiuser
USER apiuser

# If development PKCS#12 files created with OpenSSL 1.1.1 are used, the legacy provider option may be needed
# https://github.com/nodejs/node/issues/40672
CMD ["node", "--openssl-legacy-provider",  "dist/server.js"]
FROM node:20-bookworm

# Configure trust for the development root certificate authority
COPY certs/authsamples-dev.ca.crt /usr/local/share/certificates/trusted.ca.crt
RUN update-ca-certificates
ENV NODE_EXTRA_CA_CERTS='/usr/local/share/certificates/trusted.ca.crt'

# Copy files into our docker image and install dependencies
WORKDIR /usr/oauth-agent
COPY dist                /usr/oauth-agent/dist
COPY package*.json       /usr/oauth-agent/
RUN npm install --production

# Run the app as a low privilege user
RUN groupadd --gid 10000 apiuser \
  && useradd --uid 10001 --gid apiuser --shell /bin/bash --create-home apiuser
USER 10001
CMD ["node", "dist/server.js"]

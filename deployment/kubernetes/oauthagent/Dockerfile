FROM node:20-bookworm

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

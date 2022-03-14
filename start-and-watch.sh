#!/bin/sh

set -e

# set user "node" as owner of jwt folders
chown -R node:node /jwt-public-key
chown -R node:node /jwt-private-key

# TODO: disabled because of issues with JWT on server restart
# start server in watch mode
# su -p node -c 'concurrently npm:build:watch nodemon --experimental-json-modules bin/www.mjs'

# Build TS code
yarn build
# start server as user "node"
su -p node -c 'node --experimental-json-modules /app/bin/www.mjs'

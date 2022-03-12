#!/bin/sh

# set user "node" as owner of jwt folders
chown -R node:node /jwt-public-key
chown -R node:node /jwt-private-key

# start server as user "node"
su -p node -c 'node --experimental-json-modules /app/bin/www.mjs'

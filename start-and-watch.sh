#!/bin/sh

set -e

# set user "node" as owner of jwt folders
chown -R node:node /jwt-public-key
chown -R node:node /jwt-private-key

# start server in watch mode
su -p node -c 'concurrently npm:build:watch nodemon --experimental-json-modules bin/www.mjs'

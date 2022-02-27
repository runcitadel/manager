# FROM node:16-alpine@sha256:2c6c59cf4d34d4f937ddfcf33bab9d8bbad8658d1b9de7b97622566a52167f2b as base
FROM node:17-alpine@sha256:250e9a093b861c330be2f4d1d224712d4e49290eeffc287ad190b120c1fe9d9f as base


# DEVELOPMENT
FROM base AS development
# Create app directory
WORKDIR /app
# Install tools globally to avoid permission errors
RUN yarn global add concurrently nodemon
# Copy dependency management files
COPY package.json yarn.lock ./
# Install dependencies
RUN yarn install
# NOTE: Using project files from mounted volumes
EXPOSE 3006
CMD [ "concurrently", "npm:build:watch", "nodemon --experimental-json-modules bin/www.mjs" ]


# DEPENDENCIES (production)
FROM base as dependencies
# Create app directory
WORKDIR /app
# The current working directory
COPY . .
# Install production dependencies
RUN yarn workspaces focus -A --production
# Delete TypeScript code to further reduce image size
RUN find /app/node_modules | grep ".\.ts" | xargs rm


# BUILD (production)
FROM base as builder
# Create app directory
WORKDIR /app
# The current working directory
COPY . .
# Copy yarn cache
COPY --from=build-dependencies-helper /app/.yarn/cache /app/.yarn/cache 
# Install dependencies
RUN yarn install
# Build TS code
RUN yarn build
# Delete everyhing we don't need in the next stage
RUN rm -rf node_modules tsconfig.tsbuildinfo *.ts **/*.ts .eslint* .git* .prettier* .vscode* tsconfig.json .yarn* yarn.lock


# PRODUCTION
FROM base AS production
# Create app directory
WORKDIR /app
# Copy built code from build stage to '/app' directory
COPY --from=builder /app /app
# Copy node_modules
COPY --from=dependencies /app/node_modules /app/node_modules
EXPOSE 3006
CMD [ "node", "--experimental-json-modules", "bin/www.mjs" ]

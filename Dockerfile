# Define version & use pinned images
ARG NODE_VERSION=18

# Use multi-arch image for running the app
FROM node:${NODE_VERSION}-alpine@sha256:469ee26d9e00547ea91202a34ff2542f984c2c60a2edbb4007558ccb76b56df2 as base


# DEVELOPMENT
FROM base AS development
# Create app directory
WORKDIR /app
# Install tools globally to avoid permission errors
RUN yarn global add concurrently nodemon
# NOTE: Using project files from mounted volumes
EXPOSE 3006
# NOTE: Using command from docker-compose.yml


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
COPY --from=dependencies --chown=node:node /app/.yarn/cache /app/.yarn/cache 
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
COPY --from=builder --chown=node:node /app /app
# Copy node_modules
COPY --from=dependencies --chown=node:node /app/node_modules /app/node_modules
EXPOSE 3006
# NOTE: Using command from docker-compose.yml

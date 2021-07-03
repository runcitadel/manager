# Build Stage
FROM node:16-buster-slim as manager-builder

# Install tools
RUN apt-get update && apt-get install -y build-essential libffi-dev libssl-dev python3

# Create app directory
WORKDIR /app

# Copy project files and folders to the current working directory (i.e. '/app')
COPY . .

# Install dependencies
RUN yarn install --production

# Build TS code
RUN yarn build

# Final image
FROM node:16-buster-slim AS manager

# Copy built code from build stage to '/app' directory
COPY --from=manager-builder /app /app

# Change directory to '/app'
WORKDIR /app

EXPOSE 3006
CMD [ "yarn", "start" ]

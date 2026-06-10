# Build from the repository root:
#   docker build -f backend/execution-service/Dockerfile .
#
# This service launches sibling sandbox containers via the host Docker
# daemon. At runtime it needs:
#   - /var/run/docker.sock mounted
#   - SANDBOX_TEMP_DIR bind-mounted to the same path on the host
#   - the codesphere-* runtime images built (see docker/runtimes/)
FROM node:20-alpine AS deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/auth-service/package.json backend/auth-service/
COPY backend/problem-service/package.json backend/problem-service/
COPY backend/execution-service/package.json backend/execution-service/
COPY backend/assessment-service/package.json backend/assessment-service/
RUN npm ci --ignore-scripts

FROM deps AS build
COPY backend/execution-service backend/execution-service
RUN npm run build --workspace=@codesphere/execution-service

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/auth-service/package.json backend/auth-service/
COPY backend/problem-service/package.json backend/problem-service/
COPY backend/execution-service/package.json backend/execution-service/
COPY backend/assessment-service/package.json backend/assessment-service/
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY backend/execution-service/package.json ./backend/execution-service/
COPY --from=build /app/backend/execution-service/dist ./backend/execution-service/dist
# Runtime Dockerfiles so the service can self-build missing sandbox images
COPY backend/execution-service/docker ./backend/execution-service/docker
# Runs as root so it can talk to the mounted docker socket; the sandbox
# containers it spawns are themselves unprivileged and network-isolated.
WORKDIR /app/backend/execution-service
EXPOSE 8002
CMD ["node", "dist/main.js"]

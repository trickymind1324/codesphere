# Build from the repository root:
#   docker build -f backend/auth-service/Dockerfile .
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
COPY backend/auth-service backend/auth-service
RUN npm run build --workspace=@codesphere/auth-service

FROM node:20-alpine AS prod-deps
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/auth-service/package.json backend/auth-service/
COPY backend/problem-service/package.json backend/problem-service/
COPY backend/execution-service/package.json backend/execution-service/
COPY backend/assessment-service/package.json backend/assessment-service/
# Pure-JS proxy now (no native modules): a plain install is enough.
RUN npm ci --omit=dev --ignore-scripts

FROM node:20-alpine
ENV NODE_ENV=production
WORKDIR /app
COPY --from=prod-deps /app/node_modules ./node_modules
COPY backend/auth-service/package.json ./backend/auth-service/
COPY --from=build /app/backend/auth-service/dist ./backend/auth-service/dist
USER node
WORKDIR /app/backend/auth-service
EXPOSE 3001
CMD ["node", "dist/main.js"]

# Build from the repository root:
#   docker build -f backend/assessment-service/Dockerfile .
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
COPY backend/assessment-service backend/assessment-service
RUN npm run build --workspace=@codesphere/assessment-service

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
COPY backend/assessment-service/package.json ./backend/assessment-service/
COPY --from=build /app/backend/assessment-service/dist ./backend/assessment-service/dist
USER node
WORKDIR /app/backend/assessment-service
EXPOSE 8003
CMD ["node", "dist/main.js"]

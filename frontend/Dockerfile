# Build from the repository root:
#   docker build -f frontend/Dockerfile .
FROM node:20-alpine AS build
WORKDIR /app
COPY package.json package-lock.json ./
COPY frontend/package.json frontend/
COPY backend/auth-service/package.json backend/auth-service/
COPY backend/problem-service/package.json backend/problem-service/
COPY backend/execution-service/package.json backend/execution-service/
COPY backend/assessment-service/package.json backend/assessment-service/
RUN npm ci --ignore-scripts
COPY frontend frontend
# Auth mode is baked at build time (Vite). Default 'oidc' — Keycloak is the
# identity provider. 'legacy' targets the decommissioned custom auth-service
# login (POST /api/v1/auth/login), which now 404s, so it is only an escape hatch.
ARG VITE_AUTH_MODE=oidc
ARG VITE_OIDC_AUTHORITY=https://localhost/realms/codesphere
ARG VITE_OIDC_CLIENT_ID=codesphere-frontend
ENV VITE_AUTH_MODE=$VITE_AUTH_MODE \
    VITE_OIDC_AUTHORITY=$VITE_OIDC_AUTHORITY \
    VITE_OIDC_CLIENT_ID=$VITE_OIDC_CLIENT_ID
RUN npm run build --workspace=@codesphere/frontend

FROM nginx:1.27-alpine
COPY frontend/nginx.conf /etc/nginx/conf.d/default.conf
COPY frontend/proxy_params.conf /etc/nginx/proxy_params.conf
COPY --from=build /app/frontend/dist /usr/share/nginx/html
EXPOSE 80
CMD ["nginx", "-g", "daemon off;"]

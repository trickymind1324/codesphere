# API Gateway Service

The API Gateway acts as the single entry point for all client requests, routing them to the appropriate microservices.

## Technology Stack

- **Framework:** NestJS (Node.js/TypeScript)
- **HTTP Server:** Express
- **Authentication:** JWT validation
- **Rate Limiting:** Redis-based rate limiter
- **Logging:** Winston

## Responsibilities

- Request routing to microservices
- JWT token validation
- Rate limiting and throttling
- Request/response logging
- CORS handling
- Request validation
- Response transformation

## API Endpoints

All requests are proxied through the gateway:

- `/api/v1/auth/*` → Auth Service
- `/api/v1/problems/*` → Problem Service
- `/api/v1/assessments/*` → Assessment Service
- `/api/v1/execute/*` → Code Execution Service
- `/api/v1/ai/*` → AI/ML Service
- `/api/v1/analytics/*` → Analytics Service

## Development

```bash
# Install dependencies
npm install

# Run in development mode
npm run dev

# Build for production
npm run build

# Run tests
npm test

# Run linter
npm run lint
```

## Environment Variables

See `.env.example` for required environment variables.

## Docker

```bash
# Build image
docker build -t codesphere-api-gateway .

# Run container
docker run -p 8000:8000 codesphere-api-gateway
```

## Health Check

```
GET /health
```

Returns service status and version information.

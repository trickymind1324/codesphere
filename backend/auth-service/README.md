# Authentication Service

Handles all authentication and authorization operations for CodeSphere.

## Technology Stack

- **Framework:** NestJS (Node.js/TypeScript)
- **Database:** PostgreSQL with TypeORM
- **Cache:** Redis
- **Password Hashing:** Argon2id
- **JWT:** RS256 asymmetric signing
- **MFA:** TOTP (Time-based One-Time Password)

## Responsibilities

- User registration and email verification
- Email/password authentication
- OAuth integration (Google, GitHub, LinkedIn)
- JWT token generation and validation
- Multi-factor authentication (MFA)
- Password reset and recovery
- Enterprise SSO (SAML 2.0)
- Session management
- Role-based access control (RBAC)

## API Endpoints

- `POST /api/v1/auth/register` - Register new user
- `POST /api/v1/auth/login` - Login with credentials
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout and revoke tokens
- `POST /api/v1/auth/forgot-password` - Request password reset
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/oauth/{provider}` - OAuth login
- `POST /api/v1/auth/mfa/setup` - Setup MFA
- `POST /api/v1/auth/mfa/verify` - Verify MFA code

## Development

```bash
# Install dependencies
npm install

# Run database migrations
npm run db:migrate

# Seed database
npm run db:seed

# Run in development mode
npm run dev

# Run tests
npm test
```

## Security Features

- Argon2id password hashing
- JWT with RS256 signing
- Refresh token rotation
- Account lockout after failed attempts
- Rate limiting per IP and user
- MFA with backup codes
- Secure session management

## Environment Variables

See root `.env.example` for required variables.

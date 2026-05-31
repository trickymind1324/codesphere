# CodeSphere - Setup & Running Guide

This guide will help you set up and run the entire CodeSphere application locally.

## Prerequisites

- **Node.js** 20.x or higher
- **Docker** and Docker Compose
- **Git**

## Quick Start

### 1. Start Database Services

```bash
# Start PostgreSQL and Redis using Docker Compose
docker-compose up -d

# Verify services are running
docker-compose ps
```

### 2. Setup Backend Services

#### Auth Service (Port 8000)

```bash
cd backend/auth-service

# Install dependencies
npm install

# Create .env file from example
cp .env.example .env

# Generate JWT keys
chmod +x generate-keys.sh
./generate-keys.sh

# Update .env with your settings (optional for local dev)
# The defaults will work for local development

# Run database migrations
npm run migration:run

# Start the service
npm run dev
```

The Auth Service will be running at `http://localhost:8000`

#### Problem Service (Port 8001)

```bash
cd backend/problem-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Update DB_PORT to 5433 in .env
# (Because Problem Service uses the second PostgreSQL instance)

# Run database migrations
npm run migration:run

# Start the service
npm run dev
```

The Problem Service will be running at `http://localhost:8001`

#### Execution Service (Port 8002)

```bash
cd backend/execution-service

# Install dependencies
npm install

# Create .env file
cp .env.example .env

# Start the service (it will build Docker images on first run)
npm run dev
```

The Execution Service will be running at `http://localhost:8002`

**Note**: First startup will take time as it builds Docker images for code execution.

### 3. Setup Frontend

```bash
cd frontend

# Install dependencies
npm install

# Create .env file (optional - defaults work)
echo "VITE_API_URL=http://localhost:8000" > .env

# Start the development server
npm run dev
```

The Frontend will be running at `http://localhost:5173`

## What You Can Test

### 1. Authentication & User Management

#### Register New User
- Navigate to `http://localhost:5173/register`
- Fill in the registration form:
  - Full Name: Your Name
  - Email: test@example.com
  - Password: Test@123456 (min 12 chars, uppercase, lowercase, number)
  - Confirm Password: Test@123456
  - Select Role: Candidate or Recruiter
  - Accept Terms: Check the box
- Click "Create Account"

**Expected**: Registration successful message, redirected to login

#### Login
- Navigate to `http://localhost:5173/login`
- Email: test@example.com
- Password: Test@123456
- Click "Sign In"

**Expected**: Login successful, redirected to `/dashboard`

#### Dashboard
- After login, you should see the dashboard at `/dashboard`
- Shows your profile information
- Shows email verification status
- Has a logout button

**Expected**: Protected page showing user info

#### Password Reset Flow
1. Navigate to `http://localhost:5173/forgot-password`
2. Enter email and click "Send Reset Link"
3. Check console logs for the reset link (email sending is not configured yet)
4. Navigate to the reset link manually

**Expected**: Password reset email sent message

### 2. OAuth (Requires Configuration)

The Google and GitHub OAuth buttons are present but require:
- Google OAuth Client ID and Secret
- GitHub OAuth App credentials
- Update `.env` in auth-service with credentials

**For now, skip OAuth testing - manual registration works**

### 3. Backend API Testing (Using Postman/cURL)

#### Auth Service (`http://localhost:8000/api/v1`)

**Register**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/register \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "ApiTest@123456",
    "full_name": "API Test User",
    "role": "candidate"
  }'
```

**Login**:
```bash
curl -X POST http://localhost:8000/api/v1/auth/login \
  -H "Content-Type: application/json" \
  -d '{
    "email": "api@test.com",
    "password": "ApiTest@123456"
  }'
```

**Expected**: Returns `accessToken` and user info

#### Problem Service (`http://localhost:8001/api/v1`)

**Get All Problems** (Public):
```bash
curl http://localhost:8001/api/v1/problems
```

**Create Problem** (Requires Auth - Recruiter/Admin):
```bash
curl -X POST http://localhost:8001/api/v1/problems \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "title": "Two Sum",
    "description": "Given an array of integers, return indices of two numbers that add up to target",
    "difficulty": "easy",
    "status": "published",
    "tags": ["array", "hash-table"],
    "testCases": [
      {
        "input": "[2,7,11,15]\n9",
        "expectedOutput": "[0,1]",
        "isExample": true
      }
    ],
    "starterCodes": [
      {
        "language": "python",
        "code": "def twoSum(nums, target):\n    pass"
      }
    ]
  }'
```

#### Execution Service (`http://localhost:8002/api/v1`)

**Execute Code** (Requires Auth):
```bash
curl -X POST http://localhost:8002/api/v1/execute/run \
  -H "Content-Type: application/json" \
  -H "Authorization: Bearer YOUR_ACCESS_TOKEN" \
  -d '{
    "code": "print(\"Hello, World!\")",
    "language": "python"
  }'
```

**Expected**: Returns execution result with stdout "Hello, World!"

## Frontend Routes

Available routes:
- `/` - Home page
- `/login` - Login page ✅
- `/register` - Registration page ✅
- `/forgot-password` - Forgot password page ✅
- `/reset-password?token=xxx` - Reset password page ✅
- `/verify-email?token=xxx` - Email verification page ✅
- `/dashboard` - User dashboard (Protected) ✅
- `/auth/google/callback` - Google OAuth callback
- `/auth/github/callback` - GitHub OAuth callback

## Troubleshooting

### Port Already in Use
```bash
# Check what's using the port
lsof -i :8000  # or :8001, :8002, :5173

# Kill the process
kill -9 <PID>
```

### Database Connection Error
```bash
# Check if PostgreSQL is running
docker-compose ps

# Restart databases
docker-compose restart postgres-auth postgres-problems
```

### Docker Build Fails
```bash
# Ensure Docker daemon is running
docker ps

# For Execution Service, images build on startup
# Check logs if build fails
```

### Migration Fails
```bash
# Reset database (WARNING: Deletes all data)
docker-compose down -v
docker-compose up -d

# Run migrations again
cd backend/auth-service
npm run migration:run
```

## Environment Variables

### Auth Service (.env)
Key variables to set:
- `JWT_ACCESS_SECRET` - Generated by generate-keys.sh
- `JWT_REFRESH_SECRET` - Generated by generate-keys.sh
- `DB_PORT=5432` - Auth database port
- `SMTP_*` - Email settings (optional for now)

### Problem Service (.env)
- `DB_PORT=5433` - Problem database port (different from auth)
- `JWT_ACCESS_SECRET` - Same as Auth Service

### Execution Service (.env)
- `JWT_ACCESS_SECRET` - Same as Auth Service
- `ENABLE_DOCKER=true` - Enable code execution

### Frontend (.env)
- `VITE_API_URL=http://localhost:8000` - Auth Service URL

## Stopping Services

```bash
# Stop backend services (Ctrl+C in each terminal)

# Stop databases
docker-compose down

# Stop and remove volumes (deletes all data)
docker-compose down -v
```

## Next Steps

After everything is running:
1. Register a new user
2. Login with the user
3. View the dashboard
4. Test password reset flow
5. Try backend APIs with Postman

**Phase 3 (Assessment System) will add**:
- Problem browsing UI
- Code editor
- Test execution
- Submission tracking

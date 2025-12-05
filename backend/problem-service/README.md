# Problem Service

Manages coding problems, test cases, submissions, and problem-related operations.

## Technology Stack

- **Language:** Go 1.21+
- **Framework:** Gin
- **Database:** PostgreSQL
- **Cache:** Redis
- **Search:** Elasticsearch

## Responsibilities

- Problem CRUD operations
- Test case management
- Starter code templates
- Problem search and filtering
- Submission tracking
- User progress tracking
- Problem recommendations
- Difficulty calculation

## API Endpoints

- `GET /api/v1/problems` - List problems with filters
- `GET /api/v1/problems/:id` - Get problem details
- `POST /api/v1/problems` - Create problem (admin)
- `PUT /api/v1/problems/:id` - Update problem (admin)
- `DELETE /api/v1/problems/:id` - Delete problem (admin)
- `GET /api/v1/problems/:id/submissions` - Get user submissions
- `POST /api/v1/problems/:id/submit` - Submit solution

## Development

```bash
# Install dependencies
go mod download

# Run in development mode (with hot reload)
air

# Build for production
go build -o main ./cmd/main.go

# Run tests
go test ./...

# Run with coverage
go test -cover ./...
```

## Database Schema

Main tables:
- `problems` - Problem definitions
- `test_cases` - Test cases for problems
- `starter_code` - Language-specific starter code
- `submissions` - User submissions
- `user_progress` - Progress tracking

## Environment Variables

See root `.env.example` for required variables.

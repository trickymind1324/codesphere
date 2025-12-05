# Code Execution Service

Securely executes user code in isolated Docker containers with resource limits.

## Technology Stack

- **Language:** Rust
- **Framework:** Actix-web
- **Containerization:** Docker + gVisor
- **Database:** PostgreSQL
- **Cache:** Redis

## Responsibilities

- Secure code execution in sandboxed containers
- Multi-language support (Python, JavaScript, Java, C++, Go, Rust, SQL)
- Resource limiting (CPU, memory, time)
- Real-time output streaming via WebSocket
- Test case execution
- Compilation for compiled languages
- Security isolation with gVisor

## Supported Languages

- Python 3.11
- Node.js 20 (JavaScript/TypeScript)
- Java 17
- C++ 17 (GCC)
- Go 1.21
- Rust 1.75
- PostgreSQL 15 (SQL)

## API Endpoints

- `POST /api/v1/execute` - Execute code
- `POST /api/v1/execute/batch` - Execute multiple test cases
- `WS /api/v1/execute/stream` - Stream execution output

## Security Features

- Docker containerization
- gVisor runtime for kernel isolation
- Resource limits (CPU, memory, processes)
- Network isolation
- Execution time limits
- No persistent storage
- Input/output sanitization

## Development

```bash
# Install dependencies
cargo build

# Run in development mode (with hot reload)
cargo watch -x run

# Build for production
cargo build --release

# Run tests
cargo test

# Run with Docker
docker build -t code-execution-service .
docker run -p 3004:3004 -v /var/run/docker.sock:/var/run/docker.sock --privileged code-execution-service
```

## Resource Limits

- **Time:** 5 seconds per execution
- **Memory:** 256 MB
- **CPU:** 0.5 cores
- **Processes:** 20 max
- **Output:** 10 MB max

## Environment Variables

See root `.env.example` for required variables.

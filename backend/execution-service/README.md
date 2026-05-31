# Code Execution Service

A secure, containerized code execution service that runs user-submitted code in isolated Docker containers with resource limits and security sandboxing.

## Features

- **Multi-language Support**: Python, JavaScript, TypeScript, Java, C++, C, Go
- **Isolated Execution**: Each code execution runs in a separate Docker container
- **Resource Limits**: Configurable time and memory limits
- **Security**:
  - Non-root user execution
  - No network access
  - Read-only root filesystem
  - Resource constraints (CPU, memory, PIDs)
- **Test Case Validation**: Execute code against multiple test cases
- **Real-time Output**: Capture stdout, stderr, and execution metrics

## Architecture

```
┌─────────────────┐
│  API Gateway    │
└────────┬────────┘
         │
┌────────▼────────┐
│  Execution      │
│  Controller     │
└────────┬────────┘
         │
┌────────▼────────┐
│  Execution      │
│  Service        │
└────────┬────────┘
         │
┌────────▼────────┐
│  Docker         │
│  Executor       │
└────────┬────────┘
         │
┌────────▼────────┐
│  Language       │
│  Containers     │
└─────────────────┘
```

## API Endpoints

### POST /api/v1/execute/run
Execute code with optional stdin input.

**Request:**
```json
{
  "code": "print('Hello, World!')",
  "language": "python",
  "stdin": "",
  "timeLimitMs": 2000,
  "memoryLimitMb": 128
}
```

**Response:**
```json
{
  "message": "Code executed successfully",
  "result": {
    "status": "success",
    "stdout": "Hello, World!",
    "stderr": "",
    "exitCode": 0,
    "executionTimeMs": 45,
    "memoryUsageKb": 8192
  }
}
```

### POST /api/v1/execute/test
Execute code against multiple test cases.

**Request:**
```json
{
  "code": "def add(a, b):\n    return a + b",
  "language": "python",
  "testCases": [
    { "input": "1 2", "expectedOutput": "3" },
    { "input": "5 7", "expectedOutput": "12" }
  ]
}
```

### POST /api/v1/execute/submit
Submit solution to a problem (fetches test cases from Problem Service).

**Request:**
```json
{
  "problemId": "uuid",
  "code": "solution code here",
  "language": "python"
}
```

## Security Features

### Container Isolation
- Each execution runs in a fresh container
- Containers are automatically removed after execution
- No persistence between executions

### Resource Limits
- CPU: 1 core max
- Memory: Configurable (default 256MB)
- Time: Configurable (default 5000ms)
- PIDs: Max 50 processes
- Network: Disabled by default

### Sandboxing
- Non-root user execution
- Read-only code files
- Temporary directory cleanup
- Output size limits

## Supported Languages

| Language   | Version | Build Required | Extension |
|------------|---------|----------------|-----------|
| Python     | 3.11    | No             | .py       |
| JavaScript | Node 20 | No             | .js       |
| TypeScript | Node 20 | Yes (ts-node)  | .ts       |
| Java       | 17      | Yes (javac)    | .java     |
| C++        | GCC 13  | Yes (g++)      | .cpp      |
| C          | GCC 13  | Yes (gcc)      | .c        |
| Go         | Latest  | Yes (go build) | .go       |

## Building Docker Images

Docker images are automatically built on service startup. To manually build:

```bash
docker build -t codesphere-python:latest -f docker/runtimes/Dockerfile.python .
docker build -t codesphere-javascript:latest -f docker/runtimes/Dockerfile.javascript .
docker build -t codesphere-java:latest -f docker/runtimes/Dockerfile.java .
docker build -t codesphere-cpp:latest -f docker/runtimes/Dockerfile.cpp .
```

## Environment Variables

See `.env.example` for all configuration options.

## Error Handling

The service handles various error scenarios:
- `success`: Code executed successfully
- `runtime_error`: Runtime error occurred
- `compile_error`: Compilation failed
- `time_limit_exceeded`: Execution exceeded time limit
- `memory_limit_exceeded`: Exceeded memory limit
- `output_limit_exceeded`: Output too large
- `internal_error`: Service error

## Concurrency

Maximum concurrent executions can be configured via `MAX_CONCURRENT_EXECUTIONS` environment variable (default: 10).

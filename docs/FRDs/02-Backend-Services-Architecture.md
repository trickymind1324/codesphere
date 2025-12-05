# FRD-02: Backend Services Architecture

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the backend services architecture for CodeSphere, including microservices design, API specifications, communication patterns, and technology stack.

## 2. Architecture Pattern

### 2.1 Microservices Architecture

**Design Philosophy:** Domain-driven, loosely coupled services with clear boundaries

```
┌─────────────────┐
│   API Gateway   │ (Kong/AWS API Gateway)
└────────┬────────┘
         │
    ┌────┴────┐
    ├─────────┼─────────────────────────────────┐
    │         │                                 │
┌───▼────┐ ┌─▼──────────┐ ┌──────────────────┐ │
│  Auth  │ │  Problem   │ │   Assessment     │ │
│ Service│ │  Service   │ │    Service       │ │
└────────┘ └────────────┘ └──────────────────┘ │
    │                                           │
┌───▼────────────┐ ┌────────────────┐ ┌───────▼──────┐
│  Code Execution│ │  AI/ML Service │ │  Analytics   │
│    Service     │ │                │ │   Service    │
└────────────────┘ └────────────────┘ └──────────────┘
         │
    ┌────┴─────┐
    │          │
┌───▼────┐ ┌──▼──────┐
│ Message│ │  Event  │
│ Queue  │ │  Store  │
└────────┘ └─────────┘
```

### 2.2 Technology Stack

**Language Choices by Service:**
- **API Gateway:** Node.js/TypeScript (high I/O throughput)
- **Auth Service:** Node.js/TypeScript (JWT handling, session management)
- **Problem Service:** Go (performance for large-scale CRUD)
- **Assessment Service:** Go (concurrent request handling)
- **Code Execution Service:** Rust (memory safety, performance)
- **AI/ML Service:** Python (ecosystem for LLMs, TensorFlow)
- **Analytics Service:** Python (data processing, pandas, NumPy)

**Framework Choices:**
- **Node.js:** NestJS (structured, TypeScript-first)
- **Go:** Gin or Fiber (lightweight, fast HTTP routers)
- **Rust:** Actix-web or Axum (async web frameworks)
- **Python:** FastAPI (async, auto-generated OpenAPI docs)

## 3. Service Specifications

### 3.1 API Gateway Service

**Responsibilities:**
- Single entry point for all client requests
- Request routing to appropriate microservices
- Rate limiting and throttling
- Request/response transformation
- API versioning (v1, v2)
- Authentication verification (JWT validation)
- CORS handling
- Request logging and tracing

**Technology:** Kong or AWS API Gateway with custom plugins

**Key Routes:**
```
/api/v1/auth/*          → Auth Service
/api/v1/problems/*      → Problem Service
/api/v1/assessments/*   → Assessment Service
/api/v1/execute         → Code Execution Service
/api/v1/analytics/*     → Analytics Service
/api/v1/ai/tutor        → AI/ML Service
```

**Rate Limiting:**
- Free tier: 100 requests/minute
- Pro tier: 1000 requests/minute
- Enterprise: Custom limits

### 3.2 Auth Service

**Responsibilities:**
- User registration and login
- JWT token generation and validation
- OAuth2 integration (Google, GitHub, LinkedIn)
- Password reset flows
- Email verification
- Session management
- Role-based access control (RBAC)

**Tech Stack:**
- **Framework:** NestJS with TypeScript
- **Database:** PostgreSQL (user accounts, sessions)
- **Cache:** Redis (refresh tokens, session data)
- **Auth Library:** Passport.js with JWT strategy
- **Email:** SendGrid or AWS SES

**API Endpoints:**

```typescript
POST   /api/v1/auth/register
  Request: { email, password, name, role: "candidate" | "recruiter" }
  Response: { user, accessToken, refreshToken }

POST   /api/v1/auth/login
  Request: { email, password }
  Response: { accessToken, refreshToken, user }

POST   /api/v1/auth/refresh
  Request: { refreshToken }
  Response: { accessToken }

POST   /api/v1/auth/logout
  Request: { refreshToken }
  Response: { success: true }

POST   /api/v1/auth/forgot-password
  Request: { email }
  Response: { message: "Reset link sent" }

POST   /api/v1/auth/reset-password
  Request: { token, newPassword }
  Response: { success: true }

GET    /api/v1/auth/oauth/google
  Redirects to Google OAuth

GET    /api/v1/auth/oauth/callback/google
  Handles OAuth callback
```

**JWT Payload:**
```json
{
  "sub": "user_id",
  "email": "user@example.com",
  "role": "candidate",
  "iat": 1234567890,
  "exp": 1234571490
}
```

**Security:**
- Argon2 for password hashing (more secure than bcrypt)
- httpOnly cookies for refresh tokens
- Short-lived access tokens (15 minutes)
- Long-lived refresh tokens (7 days) stored in Redis

### 3.3 Problem Service

**Responsibilities:**
- CRUD operations for coding problems
- Problem categorization (difficulty, tags, topics)
- Test case management (public/hidden)
- Problem search and filtering
- User submission tracking
- Solution templates per language
- Editorial/solution content

**Tech Stack:**
- **Framework:** Go with Gin
- **Database:** PostgreSQL (problems, test cases, submissions)
- **Cache:** Redis (frequently accessed problems)
- **Search:** Elasticsearch (full-text problem search)

**Data Model (Key Entities):**

```go
type Problem struct {
    ID          uuid.UUID
    Title       string
    Slug        string       // URL-friendly: "two-sum"
    Difficulty  string       // easy, medium, hard
    Description string       // Markdown
    Constraints string
    Examples    []Example
    Tags        []string     // array, hash-table, etc.
    Companies   []string     // companies that asked this
    AcceptanceRate float64
    CreatedAt   time.Time
}

type TestCase struct {
    ID        uuid.UUID
    ProblemID uuid.UUID
    Input     string
    Output    string
    IsPublic  bool         // hidden test cases for validation
    Weight    int          // for scoring
}

type Submission struct {
    ID           uuid.UUID
    ProblemID    uuid.UUID
    UserID       uuid.UUID
    Language     string
    Code         string
    Status       string      // accepted, wrong_answer, timeout, error
    Runtime      int         // milliseconds
    Memory       int         // bytes
    TestsPassed  int
    TestsTotal   int
    SubmittedAt  time.Time
}
```

**API Endpoints:**

```
GET    /api/v1/problems
  Query: ?difficulty=medium&tag=array&page=1&limit=20
  Response: { problems: [], total, page }

GET    /api/v1/problems/:slug
  Response: { problem, testCases (public only), starterCode }

POST   /api/v1/problems/:id/submissions
  Request: { language, code, files }
  Response: { submissionId, status: "queued" }

GET    /api/v1/problems/:id/submissions/:submissionId
  Response: { status, testResults, runtime, memory }

GET    /api/v1/problems/:id/solutions
  Response: { officialSolution, topSubmissions }

POST   /api/v1/problems (Admin only)
  Request: { problem data }
  Response: { problem }
```

**Caching Strategy:**
- Cache problem details for 1 hour (high read, low write)
- Invalidate cache on problem updates
- Cache user submission history per user

### 3.4 Assessment Service

**Responsibilities:**
- Create and manage assessments (collection of problems)
- Generate unique assessment links for candidates
- Track assessment sessions
- Anti-cheating monitoring (tab switches, copy-paste)
- Time limits and auto-submission
- Assessment results and Glass Box analytics
- Candidate invitation and reminders

**Tech Stack:**
- **Framework:** Go with Gin
- **Database:** PostgreSQL (assessments, sessions, invitations)
- **Cache:** Redis (active sessions)
- **Queue:** RabbitMQ or AWS SQS (async analytics processing)

**Data Model:**

```go
type Assessment struct {
    ID              uuid.UUID
    CompanyID       uuid.UUID
    Title           string
    Description     string
    ProblemIDs      []uuid.UUID
    Duration        int           // minutes
    PassingScore    int           // percentage
    Settings        Settings
    CreatedAt       time.Time
}

type Settings struct {
    AllowCopyPaste     bool
    TabSwitchLimit     int
    ShowResultsImmediately bool
    RecordKeystrokes   bool
}

type AssessmentSession struct {
    ID              uuid.UUID
    AssessmentID    uuid.UUID
    CandidateID     uuid.UUID
    UniqueLink      string        // one-time use token
    Status          string        // invited, in_progress, submitted, expired
    StartedAt       *time.Time
    SubmittedAt     *time.Time
    TabSwitchCount  int
    CopyPasteEvents []Event
    KeystrokeData   []Keystroke   // stored in separate table
}

type AssessmentResult struct {
    SessionID       uuid.UUID
    Score           float64
    ProblemsAttempted int
    ProblemsSolved  int
    TotalTime       int           // seconds
    GlassBoxReport  GlassBoxReport
}

type GlassBoxReport struct {
    CodeChurnMetric   float64     // rewrites per line
    DebugEfficiency   float64     // ratio of test runs to solution
    ThoughtProcess    string      // AI-generated summary
    RedFlags          []string    // suspicious behaviors
}
```

**API Endpoints:**

```
POST   /api/v1/assessments
  Request: { title, problemIds, duration, settings }
  Response: { assessment }

GET    /api/v1/assessments/:id
  Response: { assessment, problems }

POST   /api/v1/assessments/:id/invite
  Request: { candidateEmails[], message }
  Response: { invitations[] }

GET    /api/v1/assessments/session/:token
  Response: { assessment, problems, timeRemaining }

POST   /api/v1/assessments/session/:token/start
  Response: { sessionId, startedAt }

POST   /api/v1/assessments/session/:sessionId/events
  Request: { eventType: "tab_switch" | "copy_paste", metadata }
  Response: { acknowledged: true }

POST   /api/v1/assessments/session/:sessionId/submit
  Request: { submissions[] }
  Response: { result, glasBoxReport }

GET    /api/v1/assessments/:id/results
  Response: { sessions[], candidates[], scores[] }
```

**Real-Time Monitoring:**
- WebSocket connection during assessment
- Track cursor position, keystrokes (if enabled)
- Detect copy-paste (code style analysis)
- Tab switch detection (client-side event)

### 3.5 Code Execution Service

**Responsibilities:**
- Execute user code securely in isolated environments
- Support multiple languages (Python, JS, Java, C++, SQL)
- Stream stdout/stderr in real-time (WebSocket)
- Enforce resource limits (CPU, memory, time)
- Run test cases and compare outputs
- Handle file-based projects (virtual file system)
- Prevent malicious code execution

**Tech Stack:**
- **Framework:** Rust with Actix-web (performance, safety)
- **Containerization:** Docker with gVisor for additional isolation
- **Orchestration:** Kubernetes (auto-scaling execution pods)
- **Queue:** Redis Queue (RQ) or BullMQ for job scheduling
- **Storage:** Ephemeral volumes (destroyed after execution)

**Execution Flow:**

```
1. Client submits code → API Gateway
2. Gateway forwards to Code Execution Service
3. Service creates job in queue (if high load) or executes immediately
4. Spin up Docker container with language runtime
5. Mount code files into container
6. Execute with resource limits (cgroups)
7. Stream output via WebSocket to client
8. Run test cases (if applicable)
9. Kill container and cleanup
10. Return results
```

**API Endpoints:**

```
POST   /api/v1/execute
  Request: {
    language: "python" | "javascript" | "java" | "cpp" | "sql",
    files: [{ name: "main.py", content: "..." }],
    stdin: "input data",
    timeout: 5000,  // milliseconds
    memoryLimit: 512  // MB
  }
  Response: {
    stdout: "output",
    stderr: "errors",
    exitCode: 0,
    executionTime: 120,  // ms
    memoryUsed: 45       // MB
  }

WS     /api/v1/execute/stream
  Message: { same as POST request }
  Stream: { type: "stdout" | "stderr" | "exit", data: "..." }

POST   /api/v1/execute/test
  Request: {
    language: "python",
    code: "...",
    testCases: [{ input: "...", expectedOutput: "..." }]
  }
  Response: {
    passed: 8,
    total: 10,
    results: [{ input, output, expected, passed, runtime }]
  }
```

**Security & Isolation:**

```rust
// Docker run command (simplified)
docker run \
  --rm \                          # Remove after execution
  --network=none \                # No internet access
  --cpus="0.5" \                  # 50% of one CPU
  --memory="512m" \               # 512MB RAM
  --memory-swap="512m" \          # No swap
  --pids-limit=50 \               # Max 50 processes
  --read-only \                   # Read-only root filesystem
  --tmpfs /tmp:rw,noexec,nosuid \ # Writable /tmp, no execution
  --security-opt=no-new-privileges \
  --cap-drop=ALL \                # Drop all Linux capabilities
  skillforge/python:3.9
```

**Language-Specific Images:**
- `skillforge/python:3.9` - Python 3.9 with common libraries
- `skillforge/node:18` - Node.js 18 with npm
- `skillforge/java:17` - OpenJDK 17
- `skillforge/cpp:gcc-11` - GCC 11 compiler
- `skillforge/postgres:15` - PostgreSQL for SQL challenges

**Performance:**
- Cold start latency: < 500ms (using warm container pool)
- Concurrent executions: 10,000+ (horizontal scaling)
- Queue processing: Prioritize paid users over free tier

### 3.6 AI/ML Service

**Responsibilities:**
- AI Socratic Tutor (hint generation, guided questions)
- Glass Box Report generation (code analysis, behavior summary)
- Problem recommendations (personalized learning paths)
- Cheating detection (code similarity, style analysis)
- Code quality assessment (complexity, best practices)
- Natural language to code (advanced feature)

**Tech Stack:**
- **Framework:** Python with FastAPI
- **LLM:** OpenAI GPT-4 or Claude 3 (Anthropic)
- **Vector Database:** Pinecone or Weaviate (for code embeddings)
- **ML Libraries:** scikit-learn, TensorFlow (for analytics models)
- **Code Analysis:** Tree-sitter (parsing), Pylint/ESLint APIs

**API Endpoints:**

```python
POST   /api/v1/ai/tutor/hint
  Request: {
    problemId: "uuid",
    userCode: "current code",
    userQuestion: "I'm stuck on...",
    conversationHistory: []
  }
  Response: {
    hint: "Have you considered what happens when...",
    tone: "encouraging",
    followUpQuestions: ["Did you try...?"]
  }

POST   /api/v1/ai/glass-box-report
  Request: {
    sessionId: "uuid",
    submissions: [],
    keystrokeData: [],
    tabSwitches: 3,
    copyPasteEvents: []
  }
  Response: {
    summary: "Candidate demonstrated strong...",
    codeChurn: 2.3,
    debugEfficiency: 0.8,
    redFlags: ["Large code block pasted at 14:23"],
    recommendation: "Interview"
  }

POST   /api/v1/ai/recommend-problems
  Request: {
    userId: "uuid",
    completedProblems: [],
    weakTopics: ["dynamic-programming"]
  }
  Response: {
    problems: [],
    reasoning: "You struggled with DP, these will help"
  }

POST   /api/v1/ai/code-similarity
  Request: {
    code1: "...",
    code2: "..."
  }
  Response: {
    similarityScore: 0.95,
    isPlagiarism: true,
    matchedSegments: [...]
  }
```

**Prompt Engineering (Socratic Tutor):**

```python
SYSTEM_PROMPT = """
You are a Socratic tutor for coding problems. Your goal is to guide
the student to the answer WITHOUT writing code for them.

Rules:
1. Never provide complete code solutions
2. Ask guiding questions
3. Point out logical errors without fixing them
4. Encourage experimentation ("What if you try...")
5. Adjust tone based on user preference (encouraging vs. strict)
"""

def generate_hint(problem, user_code, conversation):
    prompt = f"""
    Problem: {problem.description}
    User's current code: {user_code}
    Conversation: {conversation}

    The user is stuck. Ask a guiding question or provide a hint.
    """
    return call_llm(SYSTEM_PROMPT, prompt)
```

**Code Analysis Pipeline:**

```python
def generate_glass_box_report(session_data):
    # 1. Calculate metrics
    code_churn = calculate_code_churn(session_data.keystroke_data)
    debug_efficiency = len(session_data.test_runs) / session_data.attempts

    # 2. Detect anomalies
    red_flags = []
    if session_data.tab_switches > 10:
        red_flags.append("Excessive tab switching")
    if detect_paste_style_shift(session_data.code_history):
        red_flags.append("Code style inconsistency")

    # 3. Generate AI summary
    summary = call_llm(
        system="You analyze coding session data",
        prompt=f"Summarize this candidate's performance: {metrics}"
    )

    return GlassBoxReport(
        summary=summary,
        code_churn=code_churn,
        debug_efficiency=debug_efficiency,
        red_flags=red_flags
    )
```

### 3.7 Analytics Service

**Responsibilities:**
- User progress tracking and statistics
- Company hiring metrics (time-to-hire, candidate quality)
- Platform usage analytics (DAU, retention, feature adoption)
- Heatmap generation (topic performance)
- Leaderboard calculations
- Data exports (CSV, PDF reports)

**Tech Stack:**
- **Framework:** Python with FastAPI
- **Database:** PostgreSQL (aggregated data), ClickHouse (time-series data)
- **Job Scheduler:** Celery with Redis (daily aggregations)
- **Visualization:** Matplotlib/Plotly (server-side chart generation)

**API Endpoints:**

```
GET    /api/v1/analytics/user/:userId/progress
  Response: {
    totalSolved,
    byDifficulty: { easy: 10, medium: 5, hard: 2 },
    byTopic: { "arrays": 8, "trees": 4 },
    streak: 7,
    rank: 1234
  }

GET    /api/v1/analytics/user/:userId/heatmap
  Response: {
    data: [[difficulty, topic, count]],
    weeklyActivity: { "2025-01-01": 3, ... }
  }

GET    /api/v1/analytics/company/:companyId/hiring-metrics
  Response: {
    assessmentsSent: 100,
    completed: 85,
    avgTimeToHire: 14,  // days
    topCandidates: []
  }

GET    /api/v1/analytics/leaderboard
  Query: ?timeframe=month&region=global
  Response: { users: [{ rank, name, score }] }
```

## 4. Inter-Service Communication

### 4.1 Synchronous (HTTP/REST)
- **Use Case:** Request-response patterns (e.g., API Gateway → Problem Service)
- **Protocol:** HTTP/2 with gRPC for internal services (faster than REST)
- **Timeout:** 5s default, 30s for code execution

### 4.2 Asynchronous (Message Queue)
- **Use Case:** Long-running tasks, event-driven workflows
- **Technology:** RabbitMQ or AWS SQS
- **Example:** Code execution jobs, email sending, analytics processing

**Event Examples:**
```json
{
  "event": "problem.solved",
  "data": { "userId": "...", "problemId": "...", "submissionId": "..." }
}

{
  "event": "assessment.completed",
  "data": { "sessionId": "...", "candidateId": "...", "score": 85 }
}
```

### 4.3 Real-Time (WebSocket)
- **Use Case:** Live updates (code execution, collaborative whiteboard)
- **Technology:** Socket.io or native WebSockets
- **Channels:**
  - `/execute/:sessionId` - Code execution output
  - `/whiteboard/:roomId` - System design collaboration
  - `/assessment/:sessionId` - Live proctoring

## 5. API Versioning & Documentation

### 5.1 Versioning Strategy
- **URL-based:** `/api/v1/...`, `/api/v2/...`
- **Breaking changes:** New version (v2)
- **Non-breaking changes:** Same version with feature flags

### 5.2 Documentation
- **Tool:** OpenAPI 3.0 (Swagger)
- **Auto-generation:** From code annotations (FastAPI, NestJS decorators)
- **Interactive Docs:** Swagger UI at `/api/docs`

## 6. Observability

### 6.1 Logging
- **Format:** Structured JSON logs
- **Tool:** ELK Stack (Elasticsearch, Logstash, Kibana) or Datadog
- **Levels:** DEBUG, INFO, WARN, ERROR, FATAL

### 6.2 Monitoring
- **Metrics:** Prometheus + Grafana
- **Key Metrics:**
  - Request rate, latency (p50, p95, p99)
  - Error rate by service
  - Code execution queue depth
  - Active WebSocket connections

### 6.3 Tracing
- **Tool:** Jaeger or OpenTelemetry
- **Use Case:** Trace requests across microservices
- **Example:** Track a submission from API Gateway → Problem Service → Code Execution Service

## 7. Deployment & Scalability

### 7.1 Container Orchestration
- **Platform:** Kubernetes (EKS on AWS or GKE on Google Cloud)
- **Auto-scaling:** Horizontal Pod Autoscaler (HPA) based on CPU/memory

### 7.2 Service Scaling Strategies
- **API Gateway:** 3-10 replicas (based on traffic)
- **Auth Service:** 2-5 replicas (stateless, horizontally scalable)
- **Code Execution Service:** 10-100 replicas (auto-scale based on queue depth)
- **AI/ML Service:** 2-10 replicas (GPU instances if needed)

### 7.3 Database Scaling
- **PostgreSQL:** Read replicas for heavy read workloads
- **Redis:** Cluster mode for high availability
- **Elasticsearch:** 3+ node cluster

## 8. Disaster Recovery

- **Backup Strategy:** Daily automated backups (PostgreSQL, Redis snapshots)
- **RTO (Recovery Time Objective):** < 1 hour
- **RPO (Recovery Point Objective):** < 5 minutes (via continuous replication)
- **Multi-Region:** Active-passive setup (primary: us-east-1, standby: eu-west-1)

## 9. Cost Optimization

- **Serverless for Spiky Workloads:** AWS Lambda for email sending, report generation
- **Spot Instances:** For code execution workers (can handle interruptions)
- **CDN:** CloudFront for static assets, API caching
- **Reserved Instances:** For baseline compute (database, core services)

## 10. Success Metrics

- **API Latency:** p95 < 200ms (excluding code execution)
- **Availability:** 99.9% uptime (43 minutes downtime/month)
- **Throughput:** 10,000 concurrent code executions
- **Error Rate:** < 0.1% (5xx errors)

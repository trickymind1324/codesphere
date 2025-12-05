# FRD-03: Database Schema & Data Architecture

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the database architecture for CodeSphere, including schema design, data models, relationships, indexing strategies, and data management policies.

## 2. Database Technology Choices

### 2.1 Primary Database
**PostgreSQL 15+** for transactional data

**Rationale:**
- ACID compliance for critical data (users, assessments, payments)
- Rich data types (JSON, arrays, full-text search)
- Mature ecosystem with excellent tooling
- Support for complex queries and joins
- Horizontal scaling via partitioning and read replicas

### 2.2 Cache Layer
**Redis 7+** for session management and caching

**Use Cases:**
- User sessions and JWT refresh tokens
- API response caching (problem lists, leaderboards)
- Rate limiting counters
- Real-time data (active assessment sessions)
- Job queues (code execution, email sending)

### 2.3 Time-Series Data
**ClickHouse** or **TimescaleDB** for analytics

**Use Cases:**
- Keystroke data (millions of events per day)
- User activity tracking
- Platform metrics (API latency, error rates)
- Historical trends for dashboards

### 2.4 Search Engine
**Elasticsearch 8+** for full-text search

**Use Cases:**
- Problem search (title, description, tags)
- Code search in submissions
- Company/user search
- Autocomplete suggestions

### 2.5 Object Storage
**AWS S3** or **Google Cloud Storage** for binary data

**Use Cases:**
- User profile pictures
- Assessment reports (PDF exports)
- Code playback recordings
- System design diagrams (exported images)

## 3. Core Database Schemas

### 3.1 Users Schema

```sql
CREATE TABLE users (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email VARCHAR(255) UNIQUE NOT NULL,
    password_hash VARCHAR(255),  -- Argon2 hash, NULL for OAuth users
    name VARCHAR(255) NOT NULL,
    role VARCHAR(50) NOT NULL CHECK (role IN ('candidate', 'recruiter', 'admin')),
    avatar_url TEXT,
    bio TEXT,
    location VARCHAR(255),
    linkedin_url VARCHAR(500),
    github_url VARCHAR(500),
    website_url VARCHAR(500),
    email_verified BOOLEAN DEFAULT FALSE,
    is_active BOOLEAN DEFAULT TRUE,
    subscription_tier VARCHAR(50) DEFAULT 'free' CHECK (subscription_tier IN ('free', 'pro', 'enterprise')),
    oauth_provider VARCHAR(50),  -- google, github, linkedin, NULL for email
    oauth_provider_id VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    last_login_at TIMESTAMP WITH TIME ZONE,
    CONSTRAINT unique_oauth UNIQUE (oauth_provider, oauth_provider_id)
);

CREATE INDEX idx_users_email ON users(email);
CREATE INDEX idx_users_role ON users(role);
CREATE INDEX idx_users_subscription_tier ON users(subscription_tier);

-- Trigger to update updated_at
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_users_updated_at BEFORE UPDATE ON users
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
```

### 3.2 User Profiles (Candidates)

```sql
CREATE TABLE candidate_profiles (
    user_id UUID PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    current_level VARCHAR(50) CHECK (current_level IN ('beginner', 'intermediate', 'advanced', 'expert')),
    target_companies TEXT[],  -- Array of company names
    preferred_languages VARCHAR(50)[],  -- ['python', 'javascript']
    years_of_experience INT,
    current_streak INT DEFAULT 0,
    max_streak INT DEFAULT 0,
    total_problems_solved INT DEFAULT 0,
    easy_solved INT DEFAULT 0,
    medium_solved INT DEFAULT 0,
    hard_solved INT DEFAULT 0,
    total_submissions INT DEFAULT 0,
    points INT DEFAULT 0,
    global_rank INT,
    resume_url TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_candidate_profiles_rank ON candidate_profiles(global_rank);
CREATE INDEX idx_candidate_profiles_points ON candidate_profiles(points DESC);
```

### 3.3 Company Profiles (Recruiters)

```sql
CREATE TABLE companies (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    name VARCHAR(255) NOT NULL,
    domain VARCHAR(255) UNIQUE,  -- company.com
    logo_url TEXT,
    industry VARCHAR(100),
    company_size VARCHAR(50) CHECK (company_size IN ('1-10', '11-50', '51-200', '201-500', '501-1000', '1000+')),
    website_url VARCHAR(500),
    description TEXT,
    subscription_tier VARCHAR(50) DEFAULT 'trial' CHECK (subscription_tier IN ('trial', 'starter', 'growth', 'enterprise')),
    billing_email VARCHAR(255),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE TABLE company_members (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    role VARCHAR(50) NOT NULL CHECK (role IN ('owner', 'admin', 'recruiter', 'viewer')),
    invited_by UUID REFERENCES users(id),
    joined_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_company_user UNIQUE (company_id, user_id)
);

CREATE INDEX idx_company_members_company ON company_members(company_id);
CREATE INDEX idx_company_members_user ON company_members(user_id);
```

### 3.4 Problems Schema

```sql
CREATE TABLE problems (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    title VARCHAR(255) NOT NULL,
    slug VARCHAR(255) UNIQUE NOT NULL,  -- two-sum, reverse-linked-list
    difficulty VARCHAR(50) NOT NULL CHECK (difficulty IN ('easy', 'medium', 'hard')),
    description TEXT NOT NULL,  -- Markdown format
    constraints TEXT,
    examples JSONB,  -- [{ input: "...", output: "...", explanation: "..." }]
    hints JSONB,  -- ["Hint 1", "Hint 2"]
    tags VARCHAR(100)[],  -- ['array', 'hash-table', 'two-pointers']
    topics VARCHAR(100)[],  -- ['data-structures', 'algorithms']
    companies VARCHAR(100)[],  -- Companies that asked this question
    is_premium BOOLEAN DEFAULT FALSE,
    is_real_world BOOLEAN DEFAULT FALSE,  -- Real-world vs. algorithmic
    acceptance_rate DECIMAL(5,2),  -- 45.23%
    total_submissions INT DEFAULT 0,
    total_accepted INT DEFAULT 0,
    created_by UUID REFERENCES users(id),
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_problems_slug ON problems(slug);
CREATE INDEX idx_problems_difficulty ON problems(difficulty);
CREATE INDEX idx_problems_tags ON problems USING GIN(tags);  -- GIN index for array search
CREATE INDEX idx_problems_is_premium ON problems(is_premium);
CREATE INDEX idx_problems_acceptance_rate ON problems(acceptance_rate);

-- Full-text search index
CREATE INDEX idx_problems_fts ON problems USING GIN(
    to_tsvector('english', title || ' ' || description)
);
```

### 3.5 Test Cases Schema

```sql
CREATE TABLE test_cases (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    input TEXT NOT NULL,  -- JSON string or plain text
    expected_output TEXT NOT NULL,
    explanation TEXT,
    is_public BOOLEAN DEFAULT TRUE,  -- Public (shown) vs. hidden test cases
    weight INT DEFAULT 1,  -- For scoring: harder tests have higher weight
    execution_order INT,  -- Order in which tests should run
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_test_cases_problem ON test_cases(problem_id);
CREATE INDEX idx_test_cases_public ON test_cases(problem_id, is_public);
```

### 3.6 Starter Code Templates

```sql
CREATE TABLE starter_code (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL CHECK (language IN ('python', 'javascript', 'java', 'cpp', 'go', 'rust', 'sql')),
    code TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT unique_problem_language UNIQUE (problem_id, language)
);

CREATE INDEX idx_starter_code_problem ON starter_code(problem_id);
```

### 3.7 Submissions Schema

```sql
CREATE TABLE submissions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    language VARCHAR(50) NOT NULL,
    code TEXT NOT NULL,
    files JSONB,  -- For multi-file submissions: [{ name: "main.py", content: "..." }]
    status VARCHAR(50) NOT NULL CHECK (status IN ('queued', 'running', 'accepted', 'wrong_answer', 'time_limit_exceeded', 'memory_limit_exceeded', 'runtime_error', 'compilation_error')),
    runtime_ms INT,
    memory_kb INT,
    tests_passed INT DEFAULT 0,
    tests_total INT,
    test_results JSONB,  -- [{ input, output, expected, passed, runtime }]
    error_message TEXT,
    submitted_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    executed_at TIMESTAMP WITH TIME ZONE
);

CREATE INDEX idx_submissions_user ON submissions(user_id, submitted_at DESC);
CREATE INDEX idx_submissions_problem ON submissions(problem_id);
CREATE INDEX idx_submissions_status ON submissions(status);
CREATE INDEX idx_submissions_user_problem ON submissions(user_id, problem_id, submitted_at DESC);

-- Partition by submitted_at (monthly partitions for performance)
-- Example: submissions_2025_01, submissions_2025_02, etc.
```

### 3.8 User Progress Tracking

```sql
CREATE TABLE user_problem_progress (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id) ON DELETE CASCADE,
    status VARCHAR(50) NOT NULL CHECK (status IN ('not_started', 'attempted', 'solved')),
    first_attempted_at TIMESTAMP WITH TIME ZONE,
    first_solved_at TIMESTAMP WITH TIME ZONE,
    best_runtime_ms INT,
    best_memory_kb INT,
    attempts_count INT DEFAULT 0,
    last_submission_id UUID REFERENCES submissions(id),
    CONSTRAINT unique_user_problem UNIQUE (user_id, problem_id)
);

CREATE INDEX idx_user_progress_user ON user_problem_progress(user_id);
CREATE INDEX idx_user_progress_status ON user_problem_progress(user_id, status);
```

### 3.9 Assessments Schema

```sql
CREATE TABLE assessments (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    company_id UUID NOT NULL REFERENCES companies(id) ON DELETE CASCADE,
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255) NOT NULL,
    description TEXT,
    problem_ids UUID[] NOT NULL,  -- Array of problem UUIDs
    duration_minutes INT NOT NULL,  -- Total time allowed
    passing_score INT CHECK (passing_score >= 0 AND passing_score <= 100),
    settings JSONB NOT NULL DEFAULT '{
        "allowCopyPaste": false,
        "tabSwitchLimit": 5,
        "showResultsImmediately": false,
        "recordKeystrokes": true,
        "proctoring": "medium"
    }'::jsonb,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessments_company ON assessments(company_id);
CREATE INDEX idx_assessments_created_by ON assessments(created_by);
```

### 3.10 Assessment Sessions Schema

```sql
CREATE TABLE assessment_sessions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_id UUID NOT NULL REFERENCES assessments(id) ON DELETE CASCADE,
    candidate_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    unique_token VARCHAR(255) UNIQUE NOT NULL,  -- One-time use link
    status VARCHAR(50) NOT NULL DEFAULT 'invited' CHECK (status IN ('invited', 'started', 'in_progress', 'submitted', 'expired', 'cancelled')),
    invited_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    started_at TIMESTAMP WITH TIME ZONE,
    submitted_at TIMESTAMP WITH TIME ZONE,
    expires_at TIMESTAMP WITH TIME ZONE,
    time_remaining_seconds INT,
    score DECIMAL(5,2),  -- Final score 0-100
    problems_attempted INT DEFAULT 0,
    problems_solved INT DEFAULT 0,
    tab_switch_count INT DEFAULT 0,
    copy_paste_count INT DEFAULT 0,
    metadata JSONB DEFAULT '{}'::jsonb,  -- Browser info, IP, etc.
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessment_sessions_assessment ON assessment_sessions(assessment_id);
CREATE INDEX idx_assessment_sessions_candidate ON assessment_sessions(candidate_id);
CREATE INDEX idx_assessment_sessions_token ON assessment_sessions(unique_token);
CREATE INDEX idx_assessment_sessions_status ON assessment_sessions(status);
```

### 3.11 Assessment Events (Anti-Cheating)

```sql
CREATE TABLE assessment_events (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    event_type VARCHAR(50) NOT NULL CHECK (event_type IN ('tab_switch', 'copy_paste', 'focus_lost', 'fullscreen_exit', 'code_execution', 'suspicious_activity')),
    event_data JSONB,  -- { pastedCode: "...", timestamp: "...", codeLength: 150 }
    severity VARCHAR(20) CHECK (severity IN ('low', 'medium', 'high')),
    occurred_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_assessment_events_session ON assessment_events(session_id);
CREATE INDEX idx_assessment_events_type ON assessment_events(event_type);
CREATE INDEX idx_assessment_events_severity ON assessment_events(severity);
```

### 3.12 Keystroke Data (Time-Series)

```sql
-- This table will be huge, consider using TimescaleDB or ClickHouse
CREATE TABLE keystroke_data (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    problem_id UUID NOT NULL REFERENCES problems(id),
    file_name VARCHAR(255),
    line_number INT,
    character_position INT,
    key_pressed VARCHAR(10),
    action VARCHAR(20) CHECK (action IN ('insert', 'delete', 'backspace', 'paste')),
    code_snapshot TEXT,  -- Store periodically (every 10 keystrokes)
    timestamp TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Partition by session_id or timestamp for performance
CREATE INDEX idx_keystroke_session ON keystroke_data(session_id, timestamp);

-- Alternative: Store in ClickHouse for better analytics performance
```

### 3.13 Glass Box Reports

```sql
CREATE TABLE glass_box_reports (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    session_id UUID NOT NULL REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    summary TEXT NOT NULL,  -- AI-generated summary
    code_churn_metric DECIMAL(5,2),  -- Average rewrites per line
    debug_efficiency DECIMAL(5,2),  -- Test runs / total attempts
    thought_process TEXT,  -- Detailed analysis
    red_flags JSONB,  -- [{ type: "paste", timestamp: "...", description: "..." }]
    recommendation VARCHAR(50) CHECK (recommendation IN ('strong_hire', 'hire', 'maybe', 'no_hire')),
    generated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_glass_box_reports_session ON glass_box_reports(session_id);
```

### 3.14 System Design Whiteboards

```sql
CREATE TABLE whiteboards (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    assessment_session_id UUID REFERENCES assessment_sessions(id) ON DELETE CASCADE,
    problem_id UUID REFERENCES problems(id),  -- NULL for free-form whiteboard
    created_by UUID NOT NULL REFERENCES users(id),
    title VARCHAR(255),
    canvas_data JSONB NOT NULL,  -- { nodes: [], edges: [], version: 1 }
    last_edited_by UUID REFERENCES users(id),
    is_collaborative BOOLEAN DEFAULT FALSE,
    snapshot_url TEXT,  -- PNG/SVG export for reports
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

CREATE INDEX idx_whiteboards_session ON whiteboards(assessment_session_id);
CREATE INDEX idx_whiteboards_created_by ON whiteboards(created_by);
```

### 3.15 Subscriptions & Billing

```sql
CREATE TABLE subscriptions (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES users(id),
    company_id UUID REFERENCES companies(id),
    plan_type VARCHAR(50) NOT NULL CHECK (plan_type IN ('free', 'pro', 'starter', 'growth', 'enterprise')),
    status VARCHAR(50) NOT NULL CHECK (status IN ('active', 'cancelled', 'expired', 'trialing')),
    stripe_subscription_id VARCHAR(255) UNIQUE,
    stripe_customer_id VARCHAR(255),
    current_period_start TIMESTAMP WITH TIME ZONE,
    current_period_end TIMESTAMP WITH TIME ZONE,
    cancel_at TIMESTAMP WITH TIME ZONE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    CONSTRAINT one_entity_per_subscription CHECK (
        (user_id IS NOT NULL AND company_id IS NULL) OR
        (user_id IS NULL AND company_id IS NOT NULL)
    )
);

CREATE INDEX idx_subscriptions_user ON subscriptions(user_id);
CREATE INDEX idx_subscriptions_company ON subscriptions(company_id);
CREATE INDEX idx_subscriptions_stripe ON subscriptions(stripe_subscription_id);
```

## 4. Redis Data Structures

### 4.1 Session Storage
```
Key: session:{userId}
Type: Hash
TTL: 7 days
Fields: { refreshToken, deviceInfo, lastActivity }
```

### 4.2 Rate Limiting
```
Key: rate_limit:{userId}:{endpoint}
Type: String (counter)
TTL: 60 seconds
Value: request count
```

### 4.3 Active Assessment Sessions
```
Key: active_session:{sessionId}
Type: Hash
TTL: 4 hours (assessment duration + buffer)
Fields: { status, timeRemaining, lastKeystroke, tabSwitches }
```

### 4.4 Leaderboard
```
Key: leaderboard:global
Type: Sorted Set
Score: user points
Member: userId
```

### 4.5 Problem Cache
```
Key: problem:{problemId}
Type: String (JSON)
TTL: 1 hour
Value: Serialized problem data
```

## 5. Indexing Strategy

### 5.1 B-Tree Indexes
- Primary keys (UUIDs)
- Foreign keys
- Frequently filtered columns (email, status, difficulty)
- Sorting columns (created_at, score, rank)

### 5.2 GIN Indexes (PostgreSQL)
- Array columns (tags, topics, languages)
- JSONB columns (for frequent queries on JSON fields)
- Full-text search (to_tsvector)

### 5.3 Partial Indexes
```sql
-- Index only active assessments
CREATE INDEX idx_active_assessments ON assessments(company_id)
WHERE is_active = TRUE;

-- Index only premium problems
CREATE INDEX idx_premium_problems ON problems(id)
WHERE is_premium = TRUE;
```

## 6. Data Retention & Archiving

### 6.1 Hot Data (Frequent Access)
- Recent submissions (last 90 days): PostgreSQL
- Active sessions: Redis + PostgreSQL
- Current user progress: PostgreSQL

### 6.2 Warm Data (Occasional Access)
- Older submissions (90 days - 1 year): PostgreSQL with partitioning
- Historical analytics: TimescaleDB/ClickHouse
- Assessment reports: PostgreSQL + S3 (PDFs)

### 6.3 Cold Data (Rare Access)
- Archived submissions (> 1 year): S3 (compressed JSON)
- Deleted user data (GDPR compliance): S3 with encryption
- Old keystroke data: ClickHouse with compression

### 6.4 Data Deletion Policies
- **User Deletion:** Anonymize submissions, delete PII (GDPR compliance)
- **Assessment Sessions:** Keep for 2 years, then archive to S3
- **Keystroke Data:** Aggregate after 30 days, delete raw data after 90 days
- **Logs:** Keep for 30 days in hot storage, 90 days in cold storage

## 7. Backup & Recovery

### 7.1 Backup Strategy
- **PostgreSQL:**
  - Continuous archiving (WAL) for point-in-time recovery
  - Daily full backups to S3
  - Retention: 30 days
- **Redis:**
  - Daily RDB snapshots to S3
  - AOF (Append-Only File) for durability
- **ClickHouse:**
  - Daily backups of aggregated data

### 7.2 Disaster Recovery
- **RTO:** 1 hour (time to restore service)
- **RPO:** 5 minutes (maximum data loss)
- **Multi-Region:** Active-passive replication (AWS RDS Multi-AZ)

## 8. Data Migration Strategy

### 8.1 Schema Migrations
- **Tool:** Flyway or Liquibase (for Java/Go) or Alembic (for Python)
- **Process:**
  1. Version-controlled migration scripts
  2. Test migrations in staging
  3. Run migrations during low-traffic windows
  4. Rollback plan for failed migrations

### 8.2 Zero-Downtime Migrations
- **Additive Changes:** Add new columns with defaults, backfill data
- **Column Renames:** Create new column, dual-write, migrate data, drop old column
- **Table Splits:** Create new tables, migrate data asynchronously, update app logic

## 9. Performance Optimization

### 9.1 Query Optimization
- Use `EXPLAIN ANALYZE` to identify slow queries
- Add appropriate indexes (avoid over-indexing)
- Use materialized views for complex aggregations
- Implement connection pooling (PgBouncer for PostgreSQL)

### 9.2 Caching Strategy
- Cache frequently accessed, rarely changed data (problems, test cases)
- Cache TTL: 1 hour for problems, 5 minutes for leaderboards
- Cache invalidation: on problem updates, use Redis pub/sub

### 9.3 Database Sharding (Future)
- **Shard by User ID:** Distribute users across multiple PostgreSQL instances
- **Consistent Hashing:** Route requests based on user ID hash
- **Cross-Shard Queries:** Avoid or use federated query tools

## 10. Security & Compliance

### 10.1 Encryption
- **At Rest:** PostgreSQL transparent data encryption (TDE) or AWS RDS encryption
- **In Transit:** TLS 1.3 for all database connections
- **Application-Level:** Encrypt sensitive fields (SSN, payment info) before storage

### 10.2 Access Control
- **Principle of Least Privilege:** Services have read-only access where possible
- **Database Roles:**
  - `app_read`: Read-only access for analytics service
  - `app_write`: Read-write for core services
  - `admin`: Full access for migrations and maintenance

### 10.3 GDPR Compliance
- **Right to Access:** API endpoint to export user data
- **Right to Deletion:** Anonymize user data, delete PII
- **Data Portability:** Export data in JSON format
- **Audit Logs:** Track all access to sensitive data

## 11. Monitoring & Alerts

### 11.1 Database Metrics
- Connection pool utilization
- Query latency (p50, p95, p99)
- Slow query log (queries > 1s)
- Disk usage and IOPS
- Replication lag (for replicas)

### 11.2 Alerts
- **Critical:** Database down, replication lag > 1 minute
- **High:** Disk usage > 80%, connection pool exhausted
- **Medium:** Slow queries, high cache miss rate

## 12. Success Metrics

- **Query Performance:** p95 < 100ms for simple queries
- **Cache Hit Rate:** > 80% for frequently accessed data
- **Database Availability:** 99.95% uptime
- **Backup Success Rate:** 100% of daily backups succeed
- **Data Integrity:** Zero data corruption incidents

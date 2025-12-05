# FRD-05: Security & Compliance

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the security architecture, threat model, compliance requirements, and security best practices for CodeSphere. Given the platform handles user code execution and candidate data, security is paramount.

## 2. Security Principles

### 2.1 Core Principles
1. **Defense in Depth:** Multiple layers of security controls
2. **Least Privilege:** Minimal permissions required for each component
3. **Zero Trust:** Never trust, always verify
4. **Secure by Default:** Security built-in, not bolted-on
5. **Privacy by Design:** Data protection from the ground up

### 2.2 Threat Model

**Threat Actors:**
- **Malicious Candidates:** Attempt to cheat, access other candidates' data, or break out of sandbox
- **External Attackers:** DDoS attacks, SQL injection, XSS, CSRF
- **Insider Threats:** Compromised employee accounts
- **Competitors:** Scraping problems, reverse engineering

**Critical Assets:**
- User credentials and PII (personally identifiable information)
- Assessment data and candidate submissions
- Code execution sandbox (must not be compromised)
- Payment information (credit cards)
- Proprietary algorithms (AI tutor, Glass Box analytics)

## 3. Authentication & Authorization

### 3.1 User Authentication

#### Password Requirements
- **Minimum Length:** 12 characters
- **Complexity:** Uppercase, lowercase, number, special character
- **Banned Passwords:** Common passwords (rockyou.txt, leaked databases)
- **Hashing:** Argon2id (memory-hard, GPU-resistant)
  - **Parameters:** Memory: 64 MB, Iterations: 3, Parallelism: 4
  - **Salt:** 16-byte random salt per password

**Implementation:**
```typescript
import argon2 from 'argon2';

async function hashPassword(password: string): Promise<string> {
  return await argon2.hash(password, {
    type: argon2.argon2id,
    memoryCost: 65536,  // 64 MB
    timeCost: 3,        // 3 iterations
    parallelism: 4      // 4 threads
  });
}

async function verifyPassword(hash: string, password: string): Promise<boolean> {
  return await argon2.verify(hash, password);
}
```

#### Multi-Factor Authentication (MFA)
- **Mandatory For:** Enterprise accounts, admin accounts
- **Optional For:** Candidate accounts (encouraged)
- **Methods:** TOTP (Time-based One-Time Password) via Google Authenticator, Authy
- **Backup Codes:** 10 one-time use codes for account recovery
- **Implementation:** `otplib` library (Node.js) or `pyotp` (Python)

#### OAuth 2.0 Integration
- **Providers:** Google, GitHub, LinkedIn
- **Flow:** Authorization Code with PKCE (Proof Key for Code Exchange)
- **Scopes:** Profile, email only (minimal permissions)
- **Security:**
  - Validate `state` parameter to prevent CSRF
  - Verify `id_token` signature (OpenID Connect)
  - Store tokens encrypted in database

### 3.2 Session Management

#### JWT (JSON Web Tokens)
- **Access Token:**
  - **Lifetime:** 15 minutes (short-lived)
  - **Storage:** Memory (not localStorage - XSS risk)
  - **Claims:** `sub` (user ID), `email`, `role`, `iat`, `exp`
  - **Algorithm:** RS256 (asymmetric, public key for verification)

- **Refresh Token:**
  - **Lifetime:** 7 days
  - **Storage:** httpOnly cookie (XSS-safe) or Redis (with user agent fingerprint)
  - **Rotation:** Issue new refresh token on each use (detect token theft)
  - **Revocation:** Store token ID in Redis, check on refresh

**JWT Signing:**
```typescript
import jwt from 'jsonwebtoken';
import fs from 'fs';

const privateKey = fs.readFileSync('private.pem');
const publicKey = fs.readFileSync('public.pem');

function generateAccessToken(user: User): string {
  return jwt.sign(
    { sub: user.id, email: user.email, role: user.role },
    privateKey,
    { algorithm: 'RS256', expiresIn: '15m', issuer: 'skillforge.com' }
  );
}

function verifyAccessToken(token: string): JWTPayload {
  return jwt.verify(token, publicKey, {
    algorithms: ['RS256'],
    issuer: 'skillforge.com'
  }) as JWTPayload;
}
```

#### Session Revocation
- **Logout:** Blacklist refresh token in Redis (TTL = token expiry)
- **Forced Logout:** Admin can revoke all sessions for a user
- **Suspicious Activity:** Auto-logout on password change, email change, or location change

### 3.3 Authorization (RBAC)

**Roles:**
- **Candidate:** Access own submissions, problems, dashboard
- **Recruiter:** Create assessments, view candidate results (within own company)
- **Admin (Company):** Manage company settings, billing, invite recruiters
- **Platform Admin:** Full access, user management, problem creation

**Permissions (Examples):**
```typescript
enum Permission {
  VIEW_PROBLEM = 'problem:view',
  SOLVE_PROBLEM = 'problem:solve',
  CREATE_PROBLEM = 'problem:create',
  CREATE_ASSESSMENT = 'assessment:create',
  VIEW_CANDIDATE_RESULTS = 'assessment:view_results',
  MANAGE_BILLING = 'billing:manage',
  PLATFORM_ADMIN = 'platform:admin'
}

const rolePermissions: Record<Role, Permission[]> = {
  candidate: [Permission.VIEW_PROBLEM, Permission.SOLVE_PROBLEM],
  recruiter: [Permission.CREATE_ASSESSMENT, Permission.VIEW_CANDIDATE_RESULTS],
  company_admin: [...recruiterPermissions, Permission.MANAGE_BILLING],
  platform_admin: Object.values(Permission)
};
```

**Middleware:**
```typescript
function requirePermission(permission: Permission) {
  return (req: Request, res: Response, next: NextFunction) => {
    const user = req.user;  // Set by authentication middleware
    if (!user.permissions.includes(permission)) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    next();
  };
}

// Usage
router.post('/assessments', requirePermission(Permission.CREATE_ASSESSMENT), createAssessment);
```

## 4. Code Execution Sandbox Security

### 4.1 Container Isolation

**Docker Security Configuration:**
```bash
docker run \
  --rm \                              # Remove after execution
  --network=none \                    # No network access
  --cpus="0.5" \                      # CPU limit
  --memory="512m" \                   # Memory limit
  --memory-swap="512m" \              # No swap
  --pids-limit=50 \                   # Max 50 processes
  --read-only \                       # Read-only root filesystem
  --tmpfs /tmp:rw,noexec,nosuid,size=100m \  # Writable /tmp, no execution
  --security-opt=no-new-privileges \  # Cannot escalate privileges
  --cap-drop=ALL \                    # Drop all Linux capabilities
  --cap-add=CHOWN \                   # Only allow file ownership changes (if needed)
  --user=1000:1000 \                  # Run as non-root user
  skillforge/python:3.9
```

### 4.2 Additional Isolation (gVisor)
- **Purpose:** Kernel-level sandboxing (intercepts syscalls)
- **Installation:** Docker with gVisor runtime
- **Performance:** ~10% overhead, acceptable for security gain

**Docker Daemon Configuration:**
```json
{
  "runtimes": {
    "runsc": {
      "path": "/usr/local/bin/runsc"
    }
  }
}
```

**Run with gVisor:**
```bash
docker run --runtime=runsc [other flags] skillforge/python:3.9
```

### 4.3 Restricted System Calls

**Seccomp Profile (Block dangerous syscalls):**
```json
{
  "defaultAction": "SCMP_ACT_ERRNO",
  "architectures": ["SCMP_ARCH_X86_64"],
  "syscalls": [
    {
      "names": ["read", "write", "open", "close", "stat", "fstat", "mmap", "exit"],
      "action": "SCMP_ACT_ALLOW"
    },
    {
      "names": ["reboot", "swapon", "swapoff", "mount", "umount", "pivot_root"],
      "action": "SCMP_ACT_KILL"
    }
  ]
}
```

Apply with:
```bash
docker run --security-opt seccomp=seccomp-profile.json [...]
```

### 4.4 Resource Limits (Prevent DoS)
- **CPU:** 50% of one core (prevent CPU hogging)
- **Memory:** 512 MB (prevent memory exhaustion)
- **Execution Time:** 5 seconds (kill after timeout)
- **Disk I/O:** Limit read/write operations (prevent disk flooding)
- **Network:** Disabled (except whitelisted APIs for specific challenges)

**Implementation:**
```rust
use tokio::time::{timeout, Duration};
use std::process::Command;

async fn execute_code(code: &str) -> Result<Output, Error> {
    let timeout_duration = Duration::from_secs(5);

    let execution = timeout(timeout_duration, async {
        Command::new("docker")
            .args(&["run", "--rm", "--cpus=0.5", "--memory=512m", ...])
            .output()
            .await
    }).await;

    match execution {
        Ok(Ok(output)) => Ok(output),
        Ok(Err(e)) => Err(Error::Execution(e)),
        Err(_) => Err(Error::Timeout)
    }
}
```

### 4.5 Code Review & Static Analysis
- **Pre-execution Scan:** Detect obvious malicious patterns
  - File system access (open, read, write to sensitive paths)
  - Network calls (socket, connect)
  - Process spawning (fork, exec)
  - Obfuscation (eval, exec in Python)

**Example (Python AST Analysis):**
```python
import ast

class MaliciousCodeDetector(ast.NodeVisitor):
    def __init__(self):
        self.suspicious = []

    def visit_Call(self, node):
        # Check for dangerous function calls
        if isinstance(node.func, ast.Name):
            if node.func.id in ['eval', 'exec', '__import__', 'open']:
                self.suspicious.append(f"Suspicious call: {node.func.id}")
        self.generic_visit(node)

def is_code_safe(code: str) -> tuple[bool, list[str]]:
    try:
        tree = ast.parse(code)
        detector = MaliciousCodeDetector()
        detector.visit(tree)
        return len(detector.suspicious) == 0, detector.suspicious
    except SyntaxError:
        return False, ["Syntax error"]
```

## 5. API Security

### 5.1 Rate Limiting

**Strategy:** Token bucket algorithm

**Limits:**
- **Free Tier:** 100 requests/minute, 1000 requests/hour
- **Pro Tier:** 500 requests/minute, 10,000 requests/hour
- **Enterprise:** Custom limits

**Implementation (Redis):**
```typescript
import Redis from 'ioredis';

const redis = new Redis();

async function checkRateLimit(userId: string, limit: number, window: number): Promise<boolean> {
  const key = `rate_limit:${userId}`;
  const current = await redis.incr(key);

  if (current === 1) {
    await redis.expire(key, window);  // Set expiry on first request
  }

  return current <= limit;
}

// Middleware
async function rateLimitMiddleware(req: Request, res: Response, next: NextFunction) {
  const userId = req.user?.id || req.ip;
  const tier = req.user?.subscriptionTier || 'free';
  const limit = tierLimits[tier];

  if (await checkRateLimit(userId, limit, 60)) {
    next();
  } else {
    res.status(429).json({ error: 'Rate limit exceeded' });
  }
}
```

### 5.2 Input Validation

**Principles:**
- **Whitelist over Blacklist:** Define what is allowed, not what is forbidden
- **Strict Typing:** Use TypeScript, Zod for runtime validation
- **Length Limits:** Prevent buffer overflow, DoS
- **Encoding:** Escape HTML, SQL, shell commands

**Example (Zod Validation):**
```typescript
import { z } from 'zod';

const createProblemSchema = z.object({
  title: z.string().min(5).max(200),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  difficulty: z.enum(['easy', 'medium', 'hard']),
  description: z.string().min(50).max(10000),
  tags: z.array(z.string()).max(10),
  testCases: z.array(z.object({
    input: z.string().max(1000),
    output: z.string().max(1000)
  })).min(1).max(50)
});

function createProblem(req: Request, res: Response) {
  try {
    const data = createProblemSchema.parse(req.body);
    // Data is validated and typed
  } catch (error) {
    if (error instanceof z.ZodError) {
      return res.status(400).json({ errors: error.errors });
    }
  }
}
```

### 5.3 SQL Injection Prevention
- **Parameterized Queries:** Never concatenate user input into SQL
- **ORM:** Use Prisma, TypeORM, or SQLAlchemy (auto-escaping)

**Bad:**
```typescript
// NEVER DO THIS
const query = `SELECT * FROM users WHERE email = '${userInput}'`;
db.query(query);
```

**Good:**
```typescript
// Use parameterized queries
const query = 'SELECT * FROM users WHERE email = $1';
db.query(query, [userInput]);

// Or use ORM
const user = await prisma.user.findUnique({
  where: { email: userInput }
});
```

### 5.4 XSS (Cross-Site Scripting) Prevention
- **Frontend:** Sanitize user input before rendering
  - Use DOMPurify for rich text (Markdown, HTML)
  - React escapes by default (but not `dangerouslySetInnerHTML`)
- **Backend:** Set `Content-Security-Policy` header
- **Cookies:** Use `httpOnly` and `secure` flags

**CSP Header:**
```typescript
app.use((req, res, next) => {
  res.setHeader('Content-Security-Policy',
    "default-src 'self'; " +
    "script-src 'self' 'unsafe-inline' 'unsafe-eval' cdn.jsdelivr.net; " +
    "style-src 'self' 'unsafe-inline' fonts.googleapis.com; " +
    "img-src 'self' data: https:; " +
    "connect-src 'self' wss://skillforge.com"
  );
  next();
});
```

### 5.5 CSRF (Cross-Site Request Forgery) Prevention
- **SameSite Cookies:** Set `SameSite=Strict` or `SameSite=Lax`
- **CSRF Tokens:** For state-changing requests (POST, PUT, DELETE)

**Implementation:**
```typescript
import csrf from 'csurf';

const csrfProtection = csrf({ cookie: true });

app.get('/form', csrfProtection, (req, res) => {
  res.render('form', { csrfToken: req.csrfToken() });
});

app.post('/submit', csrfProtection, (req, res) => {
  // Token is automatically verified
});
```

### 5.6 CORS (Cross-Origin Resource Sharing)
- **Allowed Origins:** Only skillforge.com, app.skillforge.com
- **Credentials:** Allow credentials (cookies) only for same-origin

**Configuration:**
```typescript
import cors from 'cors';

app.use(cors({
  origin: ['https://skillforge.com', 'https://app.skillforge.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'DELETE'],
  allowedHeaders: ['Content-Type', 'Authorization']
}));
```

## 6. Data Protection & Privacy

### 6.1 Encryption

**At Rest:**
- **Database:** AWS RDS encryption (AES-256)
- **S3:** Server-side encryption (SSE-S3 or SSE-KMS)
- **Application-Level:** Encrypt PII (SSN, payment info) before storage

**In Transit:**
- **TLS 1.3:** All API communication
- **Certificate:** Let's Encrypt (auto-renewal)
- **HSTS Header:** Force HTTPS

**Configuration:**
```typescript
app.use((req, res, next) => {
  res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains; preload');
  next();
});
```

### 6.2 PII (Personally Identifiable Information) Handling
- **Minimize Collection:** Only collect necessary data
- **Anonymization:** Hash or tokenize when possible
- **Access Logging:** Log all access to PII for audit
- **Retention:** Delete data after user account deletion (GDPR)

### 6.3 GDPR Compliance

**User Rights:**
1. **Right to Access:** Export all user data (JSON format)
2. **Right to Deletion:** Delete account and anonymize data
3. **Right to Portability:** Export data in machine-readable format
4. **Right to Rectification:** Update incorrect data

**Implementation:**
```typescript
// Data export
async function exportUserData(userId: string): Promise<UserDataExport> {
  return {
    profile: await getUserProfile(userId),
    submissions: await getSubmissions(userId),
    assessments: await getAssessmentSessions(userId),
    // ... all user data
  };
}

// Data deletion
async function deleteUserAccount(userId: string): Promise<void> {
  // Anonymize instead of delete (preserve referential integrity)
  await prisma.user.update({
    where: { id: userId },
    data: {
      email: `deleted_${userId}@example.com`,
      name: 'Deleted User',
      password: null,
      avatar: null,
      // ... clear all PII
    }
  });

  // Delete refresh tokens
  await redis.del(`session:${userId}`);
}
```

### 6.4 Data Residency
- **EU Users:** Store data in eu-west-1 (Ireland) for GDPR compliance
- **US Users:** Store data in us-east-1 (Virginia)
- **Cross-Border Transfers:** Standard Contractual Clauses (SCCs)

## 7. Anti-Cheating Security

### 7.1 Browser Fingerprinting
- **Collect:** User agent, screen resolution, timezone, installed fonts, WebGL renderer
- **Purpose:** Detect multiple accounts from same device
- **Library:** FingerprintJS

**Implementation:**
```typescript
import FingerprintJS from '@fingerprintjs/fingerprintjs';

const fp = await FingerprintJS.load();
const result = await fp.get();
const fingerprint = result.visitorId;

// Send to backend on assessment start
await fetch('/api/v1/assessments/session/start', {
  method: 'POST',
  body: JSON.stringify({ sessionId, fingerprint })
});
```

### 7.2 Tab Switch Detection
- **Frontend:** Listen to `visibilitychange` event
- **Threshold:** Flag if tab switches > 5 times

**Implementation:**
```typescript
let tabSwitches = 0;

document.addEventListener('visibilitychange', () => {
  if (document.hidden) {
    tabSwitches++;

    // Report to backend
    fetch('/api/v1/assessments/session/events', {
      method: 'POST',
      body: JSON.stringify({
        sessionId,
        eventType: 'tab_switch',
        count: tabSwitches
      })
    });

    // Warn user
    if (tabSwitches > 3) {
      alert('Warning: Excessive tab switching detected');
    }
  }
});
```

### 7.3 Copy-Paste Detection
- **Frontend:** Listen to `paste` event
- **Analysis:** Compare pasted code style to user's previous code

**Implementation:**
```typescript
editor.on('paste', (event) => {
  const pastedText = event.text;

  // Send to backend for style analysis
  fetch('/api/v1/ai/code-similarity', {
    method: 'POST',
    body: JSON.stringify({
      sessionId,
      userCode: getCurrentCode(),
      pastedCode: pastedText
    })
  });
});
```

### 7.4 Code Similarity Detection (Plagiarism)
- **Algorithm:** MOSS (Measure of Software Similarity) or JPlag
- **Process:**
  1. Normalize code (remove whitespace, comments)
  2. Convert to AST (Abstract Syntax Tree)
  3. Compute similarity score
  4. Flag if similarity > 80%

**Example (Python):**
```python
import ast
from difflib import SequenceMatcher

def code_similarity(code1: str, code2: str) -> float:
    # Parse to AST
    tree1 = ast.dump(ast.parse(code1))
    tree2 = ast.dump(ast.parse(code2))

    # Compute similarity
    return SequenceMatcher(None, tree1, tree2).ratio()
```

## 8. Audit Logging

### 8.1 Events to Log
- **Authentication:** Login, logout, failed login attempts
- **Authorization:** Permission denied events
- **Data Access:** Read/write of sensitive data (PII, assessments)
- **Admin Actions:** Problem creation, user deletion, billing changes
- **Security Events:** Rate limit exceeded, suspicious code execution

### 8.2 Log Format
```json
{
  "timestamp": "2025-01-15T10:30:45Z",
  "event_type": "user.login",
  "user_id": "user-123",
  "ip_address": "203.0.113.45",
  "user_agent": "Mozilla/5.0...",
  "status": "success",
  "metadata": {
    "method": "password"
  }
}
```

### 8.3 Log Storage & Retention
- **Storage:** Elasticsearch (hot: 7 days), S3 (warm: 30 days), Glacier (cold: 1 year)
- **Access Control:** Only security team and platform admins
- **Immutability:** Logs are append-only (WORM - Write Once, Read Many)

## 9. Incident Response

### 9.1 Security Incident Types
- **Data Breach:** Unauthorized access to user data
- **Service Disruption:** DDoS attack, infrastructure failure
- **Vulnerability Disclosure:** Security researcher reports issue
- **Insider Threat:** Compromised employee account

### 9.2 Response Plan
1. **Detect:** Automated alerts (Prometheus, Sentry), user reports
2. **Triage:** Assess severity (critical, high, medium, low)
3. **Contain:** Block attacker IP, revoke tokens, disable compromised accounts
4. **Eradicate:** Patch vulnerability, rotate secrets
5. **Recover:** Restore from backups if needed
6. **Post-Mortem:** Document incident, improve defenses

### 9.3 Communication
- **Internal:** Slack #security-incidents channel
- **External:** Email users if data breach (GDPR requirement)
- **Public:** Blog post for major incidents (transparency)

## 10. Vulnerability Management

### 10.1 Dependency Scanning
- **Tool:** Snyk or Dependabot
- **Frequency:** Daily scans, auto-create PRs for critical vulnerabilities
- **Policy:** Critical vulnerabilities must be patched within 7 days

### 10.2 Penetration Testing
- **Frequency:** Annual (by external firm)
- **Scope:** Web application, API, code execution sandbox
- **Report:** Actionable recommendations with severity ratings

### 10.3 Bug Bounty Program
- **Platform:** HackerOne or Bugcrowd
- **Scope:** In-scope: Web app, API, subdomain takeover. Out of scope: Social engineering, physical attacks
- **Rewards:**
  - Critical: $1,000 - $5,000
  - High: $500 - $1,000
  - Medium: $100 - $500
  - Low: $50 - $100

## 11. Compliance & Certifications

### 11.1 SOC 2 Type II
- **Scope:** Security, availability, confidentiality
- **Timeline:** 12-18 months from launch
- **Requirements:**
  - Access controls (RBAC, MFA)
  - Encryption (at rest, in transit)
  - Audit logging
  - Incident response plan
  - Annual penetration testing

### 11.2 ISO 27001 (Optional)
- **Scope:** Information Security Management System (ISMS)
- **Requirements:** Risk assessment, security policies, employee training

### 11.3 GDPR Compliance (Required for EU users)
- **Data Protection Officer (DPO):** Appoint if processing large-scale PII
- **Privacy Policy:** Transparent data collection practices
- **Cookie Consent:** GDPR-compliant cookie banner

## 12. Security Training

### 12.1 Developer Training
- **Frequency:** Quarterly
- **Topics:**
  - OWASP Top 10
  - Secure coding practices
  - Code review for security
  - Incident response procedures

### 12.2 Phishing Simulations
- **Frequency:** Monthly
- **Goal:** Train employees to recognize phishing emails

## 13. Success Metrics

- **Zero Data Breaches:** No unauthorized access to user data
- **Vulnerability Patching:** Critical vulnerabilities patched within 7 days
- **MFA Adoption:** >80% of enterprise users enable MFA
- **Penetration Test:** No critical vulnerabilities found in annual pentest
- **Incident Response Time:** <1 hour to detect and contain security incidents

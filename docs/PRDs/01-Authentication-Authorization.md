# PRD-01: Authentication & Authorization

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft
**Owner:** Product Team

## 1. Executive Summary

This PRD defines the authentication and authorization system for CodeSphere, enabling secure user access with multiple authentication methods (email/password, OAuth), role-based permissions, and multi-factor authentication for enterprise users.

## 2. Problem Statement

**Current State:** No authentication system exists (greenfield project)

**User Pain Points:**
- Candidates need quick, frictionless signup to start practicing
- Recruiters need secure access to sensitive candidate data
- Enterprise clients require MFA and SSO for compliance
- Users forget passwords and need easy recovery

**Business Impact:**
- Without auth: Can't track user progress, monetize, or protect data
- With auth: Enable personalization, subscription management, data security

## 3. Goals & Success Metrics

### 3.1 Goals
1. **Primary:** Secure, user-friendly authentication for all user types
2. **Secondary:** Enable social login (Google, GitHub, LinkedIn) for faster onboarding
3. **Tertiary:** Support enterprise SSO (SAML) for large customers

### 3.2 Success Metrics
- **Signup Completion Rate:** >70% of users who start signup complete it
- **Login Success Rate:** >95% of login attempts succeed (low failed login rate)
- **MFA Adoption:** >80% of enterprise users enable MFA within 30 days
- **Password Reset Success:** >90% of reset requests complete successfully
- **OAuth Usage:** >50% of new signups use social login

## 4. User Personas & Use Cases

### 4.1 Persona: Alex (Candidate)
**Needs:**
- Quick signup to start solving problems immediately
- Remember me across devices
- Easy password recovery

**Use Cases:**
1. Sign up with email/password in < 2 minutes
2. Sign up with Google (one-click)
3. Reset password via email link
4. Stay logged in for 7 days (refresh token)

### 4.2 Persona: Sarah (Recruiter)
**Needs:**
- Secure access to candidate data
- Team member management (invite colleagues)
- Activity audit logs

**Use Cases:**
1. Create company account
2. Invite team members (admin, recruiter, viewer roles)
3. Enable MFA for security
4. View audit log of who accessed candidate reports

### 4.3 Persona: Enterprise Admin
**Needs:**
- Single Sign-On (SSO) integration with company IdP (Okta, Azure AD)
- Enforce MFA for all employees
- Centralized user management

**Use Cases:**
1. Configure SAML SSO with Okta
2. Auto-provision users from Azure AD
3. Enforce MFA policy for all company users
4. Revoke access when employee leaves

## 5. Functional Requirements

### 5.1 User Registration

#### Email/Password Signup
- **Input Fields:**
  - Email (validated format)
  - Password (min 12 characters, complexity requirements)
  - Full name
  - Role selection (Candidate / Recruiter)
  - Terms of Service acceptance (checkbox)
- **Validation:**
  - Email uniqueness check (real-time)
  - Password strength indicator (weak/medium/strong)
  - Banned password check (common passwords like "password123")
- **Process:**
  1. User submits form
  2. Backend creates user (password hashed with Argon2)
  3. Send verification email
  4. User clicks link to verify email
  5. Redirect to onboarding flow

#### OAuth Registration (Google, GitHub, LinkedIn)
- **Flow:**
  1. User clicks "Continue with Google"
  2. Redirect to Google OAuth consent screen
  3. User approves permissions (profile, email)
  4. Callback to CodeSphere with auth code
  5. Backend exchanges code for access token
  6. Create user account (no password needed)
  7. Redirect to dashboard
- **Data Collected:** Email, name, profile picture
- **Account Linking:** If email already exists, prompt to link accounts

#### Email Verification
- **Purpose:** Prevent spam signups, ensure valid email
- **Implementation:**
  - Send email with unique token (expires in 24 hours)
  - User clicks link: `/verify-email?token=...`
  - Mark user as verified in database
  - Show success message, redirect to dashboard
- **Reminders:** Resend verification email if not verified within 7 days

### 5.2 User Login

#### Email/Password Login
- **Input Fields:**
  - Email
  - Password
  - "Remember me" checkbox (extends session to 7 days)
- **Process:**
  1. User submits credentials
  2. Backend verifies password (Argon2)
  3. Generate access token (15 min) + refresh token (7 days)
  4. Return tokens + user object
  5. Store refresh token in httpOnly cookie
  6. Redirect to dashboard
- **Error Handling:**
  - Show "Invalid email or password" (generic message for security)
  - Lock account after 5 failed attempts (15-minute cooldown)
  - Send email notification of suspicious login attempts

#### OAuth Login
- **Same flow as OAuth registration**
- **Account Linking:** Automatically link if email matches existing account

#### Multi-Factor Authentication (MFA)
- **When Required:**
  - Enterprise users (enforced by admin)
  - Optional for candidates
- **Methods:**
  - TOTP (Time-based One-Time Password): Google Authenticator, Authy
  - SMS (future): Send code via SMS (not recommended for security)
- **Setup Flow:**
  1. User enables MFA in settings
  2. Show QR code for TOTP app
  3. User scans code, enters 6-digit code to verify
  4. Generate 10 backup codes (download or print)
  5. MFA enabled
- **Login Flow with MFA:**
  1. User enters email/password
  2. Prompt for 6-digit TOTP code
  3. Verify code (time-window: 30 seconds)
  4. Generate tokens and login

### 5.3 Password Management

#### Password Reset
- **Trigger:** User clicks "Forgot password?" on login page
- **Flow:**
  1. User enters email
  2. Backend sends reset email (with unique token, expires in 1 hour)
  3. User clicks link: `/reset-password?token=...`
  4. Show form to enter new password (confirm password field)
  5. Submit new password
  6. Hash and update password in database
  7. Invalidate all existing refresh tokens (force re-login)
  8. Show success message, redirect to login
- **Security:**
  - Rate limit: 3 reset requests per hour per email
  - Token valid for 1 hour only
  - Email doesn't reveal if account exists (generic "If your email is registered...")

#### Change Password (Authenticated)
- **Flow:**
  1. User goes to Settings > Security
  2. Enter current password + new password
  3. Verify current password
  4. Update password, invalidate refresh tokens
  5. Show success message

### 5.4 Session Management

#### Access Token (JWT)
- **Lifetime:** 15 minutes (short-lived for security)
- **Storage:** Memory only (not localStorage to prevent XSS)
- **Claims:** `{ sub: userId, email, role, iat, exp }`
- **Usage:** Sent in `Authorization: Bearer <token>` header

#### Refresh Token
- **Lifetime:** 7 days (or 30 days if "Remember me" checked)
- **Storage:** httpOnly cookie (XSS-safe) or Redis with user agent fingerprint
- **Rotation:** Issue new refresh token on each use (detect token theft)
- **Revocation:** Store token ID in Redis, check on refresh

#### Logout
- **Flow:**
  1. User clicks "Logout"
  2. Frontend sends logout request with refresh token
  3. Backend blacklists refresh token in Redis
  4. Frontend clears access token from memory
  5. Redirect to login page
- **Security:** Logout from all devices option (revoke all refresh tokens)

### 5.5 Role-Based Access Control (RBAC)

#### Roles
- **Candidate:** Solve problems, view own submissions, track progress
- **Recruiter:** Create assessments, view candidate results (own company only)
- **Company Admin:** Manage company settings, billing, invite/remove team members
- **Platform Admin:** Full access (manage users, problems, billing, etc.)

#### Permissions Matrix
| Action | Candidate | Recruiter | Company Admin | Platform Admin |
|--------|-----------|-----------|---------------|----------------|
| Solve problems | ✅ | ✅ | ✅ | ✅ |
| View own submissions | ✅ | ✅ | ✅ | ✅ |
| Create assessments | ❌ | ✅ | ✅ | ✅ |
| View candidate results | ❌ | ✅ (own company) | ✅ (own company) | ✅ (all) |
| Manage billing | ❌ | ❌ | ✅ | ✅ |
| Create problems | ❌ | ❌ | ❌ | ✅ |
| View all users | ❌ | ❌ | ❌ | ✅ |

#### Permission Checks
- **Backend:** Middleware checks user role before executing action
- **Frontend:** Hide/disable UI elements based on permissions (but always enforce on backend)

### 5.6 Enterprise Features

#### Single Sign-On (SSO) - SAML 2.0
- **Supported Providers:** Okta, Azure AD, OneLogin
- **Setup:**
  1. Company admin navigates to Settings > SSO
  2. Enter IdP metadata URL (or upload XML)
  3. Copy SP metadata URL (send to IdP admin)
  4. Enable SSO
- **Login Flow:**
  1. User clicks "Login with SSO" on company-specific login page
  2. Redirect to IdP (e.g., Okta)
  3. User authenticates with company credentials
  4. IdP sends SAML assertion back to CodeSphere
  5. CodeSphere validates assertion, creates session
  6. Redirect to dashboard

#### Auto-Provisioning (SCIM)
- **Use Case:** Automatically create/update/delete users from company's IdP
- **Flow:**
  1. Company admin enables SCIM in settings
  2. Generate API token (provide to IdP admin)
  3. IdP sends user creation events to CodeSphere SCIM endpoint
  4. CodeSphere creates users automatically

#### Audit Logs
- **Events Logged:**
  - Login/logout
  - Failed login attempts
  - Password changes
  - MFA enabled/disabled
  - User role changes
  - Candidate report access
- **UI:**
  - Company admin can view audit log in Settings > Security
  - Filter by user, event type, date range
  - Export to CSV

## 6. Non-Functional Requirements

### 6.1 Security
- **Password Hashing:** Argon2id (not bcrypt or SHA)
- **Token Signing:** RS256 (asymmetric, public key for verification)
- **HTTPS Only:** All auth endpoints require HTTPS
- **Rate Limiting:** 10 login attempts per minute per IP
- **Account Lockout:** 5 failed attempts = 15-minute lockout

### 6.2 Performance
- **Login Latency:** < 500ms (p95)
- **Token Verification:** < 10ms (cached public key)
- **OAuth Callback:** < 2 seconds total (including redirects)

### 6.3 Availability
- **Uptime:** 99.9% (auth system is critical)
- **Fallback:** If OAuth provider down, allow email/password login

## 7. User Experience & UI

### 7.1 Signup Page
**Layout:**
- Logo at top
- Heading: "Create your CodeSphere account"
- OAuth buttons: "Continue with Google", "Continue with GitHub", "Continue with LinkedIn"
- Divider: "or"
- Email/password form
- "Already have an account? Login" link

**Interactions:**
- Real-time email validation (show "Email already exists" error)
- Password strength indicator (color: red/yellow/green)
- Show/hide password toggle (eye icon)

### 7.2 Login Page
**Layout:**
- Logo at top
- Heading: "Welcome back"
- OAuth buttons
- Divider: "or"
- Email/password form
- "Forgot password?" link
- "Remember me" checkbox
- "Login" button
- "Don't have an account? Sign up" link

### 7.3 MFA Setup Page
**Layout:**
- Heading: "Enable Two-Factor Authentication"
- Instructions: "Scan this QR code with your authenticator app"
- QR code image
- Manual entry code (for non-QR apps)
- Input field: "Enter 6-digit code to verify"
- "Backup codes" section (download/print)

## 8. Technical Implementation Notes

### 8.1 JWT Structure
```json
{
  "sub": "user-uuid-123",
  "email": "user@example.com",
  "role": "candidate",
  "tier": "pro",
  "iat": 1234567890,
  "exp": 1234571490,
  "iss": "skillforge.com",
  "aud": "skillforge-api"
}
```

### 8.2 API Endpoints
- `POST /api/v1/auth/register` - Email/password registration
- `POST /api/v1/auth/login` - Email/password login
- `POST /api/v1/auth/refresh` - Refresh access token
- `POST /api/v1/auth/logout` - Logout (revoke refresh token)
- `POST /api/v1/auth/forgot-password` - Send password reset email
- `POST /api/v1/auth/reset-password` - Reset password with token
- `GET /api/v1/auth/oauth/{provider}` - OAuth login (Google, GitHub, LinkedIn)
- `GET /api/v1/auth/oauth/callback/{provider}` - OAuth callback
- `POST /api/v1/auth/verify-email` - Verify email with token
- `POST /api/v1/auth/mfa/setup` - Setup MFA (get QR code)
- `POST /api/v1/auth/mfa/verify` - Verify MFA code
- `POST /api/v1/auth/mfa/disable` - Disable MFA

## 9. Edge Cases & Error Handling

### 9.1 OAuth Account Linking
**Scenario:** User signs up with email/password, later tries to login with Google using same email
**Handling:** Prompt user to link accounts or login with password

### 9.2 Expired Email Verification
**Scenario:** User clicks verification link after 24 hours
**Handling:** Show "Link expired. Click here to resend verification email"

### 9.3 Lost MFA Device
**Scenario:** User enabled MFA but lost phone with authenticator app
**Handling:** Use backup codes to login, then disable/re-enable MFA

### 9.4 Concurrent Logins
**Scenario:** User logs in on multiple devices
**Handling:** Allow concurrent sessions (issue separate refresh tokens per device)

## 10. Privacy & Compliance

### 10.1 GDPR Compliance
- **Data Minimization:** Only collect necessary data (email, name, role)
- **Right to Access:** API endpoint to export all user data
- **Right to Deletion:** Anonymize user data on account deletion
- **Consent:** Terms of Service acceptance required on signup

### 10.2 Data Storage
- **Passwords:** Never stored in plain text (Argon2 hash)
- **OAuth Tokens:** Encrypted before storage
- **Audit Logs:** Retained for 90 days (compliance)

## 11. Rollout Plan

### Phase 1: MVP (Week 1-2)
- Email/password registration and login
- JWT access/refresh tokens
- Password reset flow
- Basic RBAC (candidate, recruiter, admin)

### Phase 2: OAuth (Week 3)
- Google OAuth integration
- GitHub OAuth integration
- LinkedIn OAuth integration (if needed)

### Phase 3: MFA (Week 4)
- TOTP setup and verification
- Backup codes
- MFA enforcement for enterprise

### Phase 4: Enterprise (Week 5-6)
- SAML SSO support
- SCIM auto-provisioning (optional)
- Audit logs

## 12. Open Questions
1. Should we support SMS-based MFA? (Security concern: SIM swapping)
2. Should we allow username-based login (in addition to email)?
3. What's the account lockout policy after failed MFA attempts?
4. Do we need device fingerprinting for suspicious login detection?

## 13. Success Criteria
- ✅ 95% login success rate
- ✅ <500ms login latency (p95)
- ✅ >50% OAuth adoption for new signups
- ✅ >80% MFA adoption for enterprise users
- ✅ Zero auth-related security incidents in first 3 months

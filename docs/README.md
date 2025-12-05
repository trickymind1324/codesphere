# CodeSphere Documentation

This directory contains comprehensive product and technical documentation for CodeSphere, a unified technical skill platform that bridges algorithmic challenges with real-world engineering practice.

## 📁 Document Structure

### Strategy & Overview
- **Product_Strategy.md** - Executive summary, user personas, USPs, and high-level roadmap
- **PRD - Candidate Side.md** - Original candidate learning zone requirements (reference)
- **PRD - Enterprise side.md** - Original enterprise hiring hub requirements (reference)
- **FRD - Technical Architecture.md** - Original Universal Code Execution Engine specs (reference)

### Feature Requirement Documents (FRDs/)

Technical architecture and implementation specifications:

1. **[01-Frontend-Architecture.md](FRDs/01-Frontend-Architecture.md)**
   - React + TypeScript stack
   - Monaco Editor integration
   - State management with Zustand & TanStack Query
   - Component architecture and performance requirements

2. **[02-Backend-Services-Architecture.md](FRDs/02-Backend-Services-Architecture.md)**
   - Microservices design (API Gateway, Auth, Problem, Assessment, Code Execution, AI/ML, Analytics)
   - API specifications and data models
   - Inter-service communication patterns
   - Deployment and scaling strategies

3. **[03-Database-Schema-Data-Architecture.md](FRDs/03-Database-Schema-Data-Architecture.md)**
   - PostgreSQL schemas (users, problems, submissions, assessments)
   - Redis caching strategies
   - Data retention and archiving policies
   - Backup and recovery procedures

4. **[04-Infrastructure-DevOps.md](FRDs/04-Infrastructure-DevOps.md)**
   - AWS infrastructure setup (EKS, RDS, ElastiCache, S3)
   - Kubernetes configuration
   - CI/CD pipelines (GitHub Actions + ArgoCD)
   - Monitoring, logging, and alerting

5. **[05-Security-Compliance.md](FRDs/05-Security-Compliance.md)**
   - Authentication & authorization (JWT, OAuth, MFA)
   - Code execution sandbox security
   - API security (rate limiting, input validation)
   - GDPR compliance and data protection

6. **[06-AI-ML-Services-Architecture.md](FRDs/06-AI-ML-Services-Architecture.md)**
   - Socratic AI Tutor implementation
   - Glass Box analytics pipeline
   - Problem recommendations algorithm
   - Code plagiarism detection

### Product Requirement Documents (PRDs/)

Feature specifications and user experiences:

1. **[01-Authentication-Authorization.md](PRDs/01-Authentication-Authorization.md)**
   - Email/password and OAuth registration
   - Multi-factor authentication
   - Role-based access control (RBAC)
   - Enterprise SSO (SAML)

2. **[02-Problem-Solving-IDE.md](PRDs/02-Problem-Solving-IDE.md)**
   - Cloud IDE with Monaco Editor
   - Code execution and testing
   - AI Socratic tutor integration
   - Real-world debugging scenarios

3. **[03-Assessment-Hiring-Platform.md](PRDs/03-Assessment-Hiring-Platform.md)**
   - Assessment creation and management
   - Candidate invitation and monitoring
   - Glass Box analytics reporting
   - Anti-cheating measures

4. **[04-Monetization-Pricing-Strategy.md](PRDs/04-Monetization-Pricing-Strategy.md)**
   - Pricing tiers (Free, Pro, Starter, Growth, Enterprise)
   - Payment processing with Stripe
   - Revenue projections and unit economics
   - Churn reduction strategies

## 🎯 Key Product Differentiators

### vs. LeetCode
- **Real-world scenarios** instead of just algorithms
- **AI Socratic tutor** for guided learning
- **Glass Box analytics** to track problem-solving process
- **Multi-file projects** with terminal access

### vs. HackerRank
- **Modern cloud IDE** (VS Code-like experience)
- **Candidate-friendly** interface (less stressful)
- **Advanced anti-cheating** (beyond simple proctoring)
- **Process over results** (how you solve matters)

## 📊 Development Phases

### Phase 1: MVP (Months 1-3)
- Universal Code Sandbox (Python, JavaScript, Java, C++)
- 50 algorithmic problems + 10 real-world debugging tasks
- Basic assessment creation and candidate invitation
- Email/password authentication

### Phase 2: AI Layer (Months 4-6)
- AI Socratic Tutor (hint generation)
- Glass Box Analytics (keystroke tracking, behavior analysis)
- System Design Whiteboard
- Advanced anti-cheating

### Phase 3: Ecosystem (Months 7-12)
- Marketplace for user-created content
- Live interview "Pair Programming" mode
- IDE plugin for local development
- Advanced integrations (ATS, Slack, etc.)

## 🏗️ Technical Architecture Overview

### Frontend
- **Framework:** React 18 + TypeScript + Vite
- **UI:** Radix UI + Tailwind CSS
- **Editor:** Monaco Editor (powers VS Code)
- **State:** Zustand + TanStack Query

### Backend
- **Languages:** Node.js (API Gateway, Auth), Go (Problem, Assessment), Rust (Code Execution), Python (AI/ML)
- **Databases:** PostgreSQL, Redis, Elasticsearch, ClickHouse (analytics)
- **Infrastructure:** AWS EKS (Kubernetes), RDS, ElastiCache, S3

### Security
- **Authentication:** JWT (RS256) + OAuth 2.0 + MFA (TOTP)
- **Code Execution:** Docker + gVisor sandboxing
- **Data:** Encryption at rest (AES-256) and in transit (TLS 1.3)

## 💰 Business Model

### Candidate (B2C)
- **Free:** 100 problems, 10 AI hints/day
- **Pro ($29/mo):** All problems, unlimited hints, code playback, ad-free

### Enterprise (B2B)
- **Starter ($499/mo):** 50 assessments/month, 5 team members
- **Growth ($999/mo):** 200 assessments/month, 20 team members, ATS integrations
- **Enterprise (Custom):** Unlimited assessments, SSO, custom SLA

**Target ARR (Year 1):** $4.3M

## 📈 Success Metrics

### Candidate Side
- **Problem Completion Rate:** >40%
- **AI Tutor Engagement:** >30%
- **Pro Conversion:** >10%
- **Monthly Churn:** <5%

### Enterprise Side
- **Assessment Completion:** >70%
- **Interview Conversion:** >60% (pass assessment → pass interview)
- **Time-to-Hire Reduction:** 20%
- **Customer NPS:** >50

## 🚀 Getting Started

For developers joining the project:

1. **Start with Product_Strategy.md** to understand the vision
2. **Review relevant PRDs** for features you'll build
3. **Reference FRDs** for technical implementation details
4. **Check CLAUDE.md** in root for development commands

## 📝 Document Conventions

- **FRDs (Technical):** Architecture, APIs, infrastructure
- **PRDs (Product):** User stories, UX, business logic
- **Version:** All docs versioned, updated date tracked
- **Status:** Draft → Review → Approved

## 🤝 Contributing

When adding new features:

1. Create PRD first (define what and why)
2. Create FRD for technical design (define how)
3. Get stakeholder review
4. Implement with reference to docs
5. Update docs with learnings post-launch

## 📞 Contact

- **Product Questions:** Product Team
- **Technical Questions:** Engineering Team
- **Business Questions:** Business Team

---

**Last Updated:** December 2025
**Document Version:** 1.0

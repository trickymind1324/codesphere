# CodeSphere

> **Where Code Meets Reality**

A unified technical skill platform that bridges algorithmic challenges with real-world engineering practice.

---

## 🎯 What is CodeSphere?

CodeSphere is a **two-sided marketplace** that revolutionizes technical skill assessment and development:

### For Developers (B2C)
- **Modern Cloud IDE** - VS Code-like experience with Monaco Editor, multi-file support, and integrated terminal
- **Real-World Scenarios** - Fix memory leaks, debug race conditions, optimize slow queries (not just "Reverse a Linked List")
- **AI Socratic Tutor** - Get hints and guidance without spoiling the solution
- **Code Playback** - Watch your coding session replay to analyze your approach
- **Progress Analytics** - Heatmaps, skill tracking, personalized recommendations

### For Companies (B2B)
- **Glass Box Analytics** - Track *how* candidates solve problems (keystrokes, debugging approach, code quality)
- **Advanced Anti-Cheating** - Tab switch detection, paste analysis, code style consistency checks
- **Customizable Assessments** - Mix algorithms + real-world debugging + system design
- **Better Candidate Experience** - Modern IDE, less stressful, immediate feedback (optional)

---

## 📁 Documentation

All comprehensive documentation is in the [`docs/`](./docs/) directory:

### Strategy & Planning
- **[Product Strategy](./docs/Product_Strategy.md)** - Vision, USPs, roadmap
- **[Development Roadmap](./docs/DEVELOPMENT-ROADMAP.md)** - 52-week implementation plan (0% → 100%)

### Technical Specifications (FRDs/)
1. **[Frontend Architecture](./docs/FRDs/01-Frontend-Architecture.md)** - React/TypeScript, Monaco Editor, state management
2. **[Backend Services](./docs/FRDs/02-Backend-Services-Architecture.md)** - Microservices, API specs, scaling
3. **[Database & Data](./docs/FRDs/03-Database-Schema-Data-Architecture.md)** - PostgreSQL schemas, Redis caching, retention
4. **[Infrastructure & DevOps](./docs/FRDs/04-Infrastructure-DevOps.md)** - AWS/Kubernetes, CI/CD, monitoring
5. **[Security & Compliance](./docs/FRDs/05-Security-Compliance.md)** - Auth, sandboxing, GDPR, pentesting
6. **[AI/ML Services](./docs/FRDs/06-AI-ML-Services-Architecture.md)** - Socratic tutor, Glass Box analytics, recommendations

### Product Requirements (PRDs/)
1. **[Authentication & Authorization](./docs/PRDs/01-Authentication-Authorization.md)** - OAuth, MFA, RBAC, SSO
2. **[Problem Solving IDE](./docs/PRDs/02-Problem-Solving-IDE.md)** - Code editor, execution, AI tutor
3. **[Assessment Platform](./docs/PRDs/03-Assessment-Hiring-Platform.md)** - Creation, monitoring, Glass Box reports
4. **[Monetization & Pricing](./docs/PRDs/04-Monetization-Pricing-Strategy.md)** - Pricing tiers, Stripe, revenue projections

See **[docs/README.md](./docs/README.md)** for full documentation index.

---

## 🚀 Quick Start

### For New Developers

1. **Read the docs:**
   ```bash
   cat CLAUDE.md  # Claude Code guidance
   cat docs/README.md  # Full documentation index
   cat docs/DEVELOPMENT-ROADMAP.md  # 52-week implementation plan
   ```

2. **Set up your environment:**
   - See [Week 1-2 in Development Roadmap](./docs/DEVELOPMENT-ROADMAP.md#phase-0)
   - Install: Node.js 18+, Docker, VS Code
   - Clone repos (when created): `codesphere-frontend`, `codesphere-backend`

3. **Pick your phase:**
   - **Phase 0-1** (Weeks 1-6): Foundation, authentication
   - **Phase 2** (Weeks 7-12): Problem solving IDE
   - **Phase 3** (Weeks 13-16): Code execution engine
   - See roadmap for details

---

## 🎨 Brand

**Name:** CodeSphere
**Tagline:** "Where Code Meets Reality"
**Domain:** codesphere.io or codesphere.dev
**Colors:** TBD
**Logo:** TBD

**Why CodeSphere?**
- **"Code"** - Technical focus
- **"Sphere"** - Complete ecosystem, 360° view, global scale
- **Available** - No existing coding assessment platform using this name

---

## 💰 Business Model

### B2C (Candidates)
- **Free:** 100 problems, 10 AI hints/day
- **Pro ($29/mo):** All problems, unlimited hints, code playback, ad-free

### B2B (Enterprise)
- **Starter ($499/mo):** 50 assessments/month, 5 team members
- **Growth ($999/mo):** 200 assessments/month, 20 team members, ATS integrations
- **Enterprise (Custom):** Unlimited, SSO, dedicated support

**Target ARR (Year 1):** $4.3M

---

## 📊 Key Differentiators

| Feature | LeetCode/HackerRank | CodeSphere |
|---------|---------------------|------------|
| Problems | Abstract algorithms | **Real-world debugging scenarios** |
| Assessment | Pass/fail test cases | **Glass Box analytics (how you solve)** |
| Learning | Static solutions | **AI Socratic tutor (guided learning)** |
| IDE | Basic text editor | **Modern cloud IDE (multi-file, terminal)** |
| Cheating Detection | Basic proctoring | **Advanced (tab switches, paste analysis, code style)** |

---

## 🏗️ Technical Stack

**Frontend:** React 18 + TypeScript + Vite + Monaco Editor + Tailwind CSS
**Backend:** Node.js (API Gateway, Auth) + Go (Problems, Assessments) + Rust (Code Execution) + Python (AI/ML)
**Databases:** PostgreSQL, Redis, Elasticsearch, ClickHouse (analytics)
**Infrastructure:** AWS EKS (Kubernetes), RDS, ElastiCache, S3
**AI:** OpenAI GPT-4 / Claude for tutoring and analytics
**Payments:** Stripe

---

## 📈 Development Phases

### Phase 0: Foundation (Weeks 1-2)
✅ Team setup, infrastructure, CI/CD

### Phase 1: Authentication (Weeks 3-6)
✅ Email/password, OAuth, RBAC, database schema

### Phase 2: Problem Solving IDE (Weeks 7-12)
✅ Monaco Editor, problem service, basic code execution, submissions

### Phase 3: Code Execution Engine (Weeks 13-16)
✅ Docker sandbox, gVisor, WebSocket streaming, job queue

### Phase 4: Assessment Platform (Weeks 17-22)
✅ Assessment creation, invitations, anti-cheating, recruiter dashboard

### Phase 5: AI/ML Integration (Weeks 23-28)
✅ Socratic tutor, Glass Box analytics, keystroke tracking, recommendations

### Phase 6: Analytics & Monetization (Weeks 29-34)
✅ User dashboard, Stripe payments, feature gating, referral program

### Phase 7: Polish & Launch (Weeks 35-40)
✅ Testing, performance optimization, security audit, beta launch

### Phase 8: Post-Launch Growth (Weeks 41-52)
✅ Public launch, code playback, system design whiteboard, marketplace

**Full details:** [docs/DEVELOPMENT-ROADMAP.md](./docs/DEVELOPMENT-ROADMAP.md)

---

## 📞 Team & Roles

### Core Team (Months 1-6)
- 2 Frontend Engineers (React/TypeScript)
- 2 Backend Engineers (Node.js, Go, Rust)
- 1 DevOps Engineer
- 1 Product Manager
- 1 UI/UX Designer

### Expanded Team (Months 7-12)
- +3 Backend Engineers
- +1 Frontend Engineer
- +1 QA Engineer
- +1 Customer Success Manager
- +1 Sales Representative

---

## 🎯 Success Metrics (Year 1)

**Candidate Side:**
- 100,000 total users
- 10,000 Pro subscribers (10% conversion)
- >40% problem completion rate
- >4.5/5 user satisfaction

**Enterprise Side:**
- 100 enterprise customers
- >70% assessment completion rate
- >60% interview conversion (pass assessment → pass interview)
- 20% reduction in time-to-hire

**Revenue:**
- **B2C ARR:** $3.48M (10,000 × $29/mo × 12)
- **B2B ARR:** $839K (50 Starter + 20 Growth + 5 Enterprise)
- **Total ARR:** ~$4.3M

---

## 📝 License

TBD (Proprietary for MVP, consider open-source components later)

---

## 🤝 Contributing

This is currently a planning/documentation phase. Development will begin in Phase 0.

For questions or suggestions, see the team structure in the Development Roadmap.

---

**Last Updated:** December 2025
**Version:** 1.0 (Planning Phase)
**Status:** Pre-Development

---

**Built with ❤️ to revolutionize technical hiring and skill development**

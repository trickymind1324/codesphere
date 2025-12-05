# PRD-03: Assessment & Hiring Platform (Enterprise)

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft
**Owner:** Product Team

## 1. Executive Summary

This PRD defines the assessment and hiring platform for enterprise clients (recruiters, hiring managers, CTOs). It enables companies to create technical assessments, invite candidates, monitor sessions with anti-cheating measures, and analyze results using Glass Box analytics.

## 2. Problem Statement

**Current State (HackerRank/Cod**ility):**
- **Binary Scoring:** Pass/fail based on test cases (no insight into problem-solving process)
- **Easy to Cheat:** Candidates copy solutions from online, hard to detect
- **Generic Assessments:** One-size-fits-all, doesn't match company needs
- **Poor Candidate Experience:** Stressful, impersonal, feels like a test

**Our Solution:**
- **Glass Box Analytics:** Track *how* candidates solve (keystrokes, debugging approach)
- **Advanced Anti-Cheating:** Tab switching, paste detection, code style analysis
- **Customizable Assessments:** Mix algorithms + real-world debugging + system design
- **Better CX:** Modern IDE, less stress, immediate feedback (optional)

## 3. Goals & Success Metrics

### 3.1 Goals
1. **Primary:** Enable companies to assess technical skills accurately and efficiently
2. **Secondary:** Reduce false negatives (good candidates rejected due to test anxiety)
3. **Tertiary:** Provide actionable insights (Glass Box reports) to inform interviews

### 3.2 Success Metrics
- **Time-to-Hire Reduction:** 20% faster hiring cycle for clients
- **Interview Conversion:** >60% of candidates who pass assessment also pass interview
- **Assessment Completion Rate:** >70% of invited candidates complete assessment
- **Customer Retention:** >80% of enterprise clients renew after 1 year
- **NPS (Recruiter):** >50

## 4. User Personas & Use Cases

### 4.1 Persona: Sarah (Technical Recruiter)
**Needs:**
- Quick assessment creation (don't want to spend hours)
- Automated candidate invitations
- Dashboard to track candidate progress
- Reports to share with hiring manager

**Use Cases:**
1. Create assessment for "Senior React Dev" role in 10 minutes
2. Invite 20 candidates via email
3. View real-time dashboard (who started, who finished)
4. Download Glass Box report for top 3 candidates

### 4.2 Persona: Mike (Hiring Manager / Engineering Lead)
**Needs:**
- Ensure assessment tests real-world skills (not just algorithms)
- Review candidate code quality, debugging approach
- Identify red flags (cheating, copy-paste)

**Use Cases:**
1. Review assessment problems (approve before sending)
2. Watch code playback for top candidate
3. Read Glass Box report: "Candidate demonstrated strong debugging skills..."
4. Decide: Interview or Reject

### 4.3 Persona: Jamie (Candidate Taking Assessment)
**Needs:**
- Clear instructions and expectations
- Modern IDE (not archaic text editor)
- Reasonable time limits
- Feedback on performance (optional)

**Use Cases:**
1. Receive email invitation
2. Click link, start assessment
3. Solve problems in familiar IDE
4. Submit assessment
5. (Optional) See results immediately

## 5. Functional Requirements

### 5.1 Assessment Creation

#### Assessment Builder Page
**Layout:**
```
┌──────────────────────────────────────────────────┐
│  Create Assessment                               │
├──────────────────────────────────────────────────┤
│  1. Basic Info                                   │
│     • Title: [Senior React Developer Test]      │
│     • Description: [Optional]                   │
│     • Job Role: [Dropdown: Frontend, Backend,   │
│       Fullstack, Data Science, DevOps]          │
│                                                  │
│  2. Select Problems (3-5 recommended)            │
│     [Search problems or browse by tag]          │
│                                                  │
│     Selected Problems:                           │
│     ✓ Two Sum (Easy, Algorithms)  [Remove]      │
│     ✓ Fix Memory Leak (Medium, Debugging)       │
│     ✓ Design Twitter (System Design)            │
│                                                  │
│     [+ Add Problem]                              │
│                                                  │
│  3. Settings                                     │
│     • Duration: [90] minutes                    │
│     • Passing Score: [60]%                      │
│     • Allow Copy-Paste: [ ] No [✓] Yes          │
│     • Tab Switch Limit: [5]                     │
│     • Show Results Immediately: [ ] Yes [✓] No  │
│     • Record Keystrokes: [✓] Yes [ ] No         │
│     • Proctoring Level: [Low/Medium/High]       │
│                                                  │
│  4. Candidate Instructions (Optional)            │
│     [Rich text editor for custom instructions]  │
│                                                  │
│  [Save Draft] [Create Assessment]               │
└──────────────────────────────────────────────────┘
```

**Problem Selection:**
- **Search:** Search by title, tags, difficulty
- **Filter:** Difficulty, topic, type (algorithm/debugging/system design)
- **Preview:** Click problem to see full description
- **Mix & Match:** Combine algorithm + debugging + system design
- **Custom Problems:** Upload own problems (future)

**Smart Recommendations:**
- **Based on Role:** Frontend → React debugging, CSS challenges
- **Popular Combinations:** "Most used by companies like yours"
- **Time Estimate:** "This assessment will take ~90 minutes"

#### Assessment Templates (Quick Start)
**Pre-built Templates:**
- "Frontend Developer (React)" - 3 React problems, 1 CSS challenge
- "Backend Developer (Python)" - 2 algorithms, 1 API debugging, 1 SQL query
- "Full-Stack Engineer" - 1 frontend, 1 backend, 1 system design
- "Data Scientist" - 2 data analysis, 1 ML model optimization

**Customization:** User can modify template after selecting

### 5.2 Candidate Invitation

#### Invite Candidates Modal
```
┌──────────────────────────────────────────────┐
│  Invite Candidates                           │
├──────────────────────────────────────────────┤
│  Method 1: Email Invitations                 │
│  Enter email addresses (one per line):       │
│  ┌──────────────────────────────────────────┐│
│  │ candidate1@example.com                   ││
│  │ candidate2@example.com                   ││
│  │                                          ││
│  └──────────────────────────────────────────┘│
│  [Upload CSV]                                │
│                                              │
│  Method 2: Public Link (Less Secure)         │
│  [Generate Public Link] (Anyone with link    │
│  can take assessment - use for job postings) │
│                                              │
│  Email Template:                             │
│  Subject: [Assessment Invitation from {Co}]  │
│  Body: [Customize email template...]        │
│                                              │
│  Expiration: [7 days] (Link expires after)   │
│                                              │
│  [Send Invitations]                          │
└──────────────────────────────────────────────┘
```

**Email Invitation:**
```
Subject: Assessment Invitation from Acme Corp

Hi {Candidate Name},

Thank you for applying to Acme Corp! As the next step, we'd like
you to complete a technical assessment.

Assessment: Senior React Developer Test
Duration: 90 minutes
Expires: January 22, 2025

[Start Assessment] (Unique link)

Tips:
- Use a laptop/desktop (not mobile)
- Ensure stable internet connection
- You can pause and resume within the time limit

Questions? Reply to this email.

Best,
Sarah (Recruiter, Acme Corp)
```

**Unique Links:**
- Each candidate gets unique token (prevents sharing)
- One-time use (can't retake unless recruiter allows)
- Tracks candidate progress

### 5.3 Assessment Dashboard (Recruiter View)

**Layout:**
```
┌────────────────────────────────────────────────────────────┐
│  Assessment: Senior React Developer Test                   │
├────────────────────────────────────────────────────────────┤
│  Status: Active      Invited: 20      Completed: 12        │
│                                                            │
│  [Candidates Tab] [Analytics Tab] [Settings Tab]           │
│                                                            │
│  Candidates:                                               │
│  ┌──────────────────────────────────────────────────────┐ │
│  │ Name           Status      Score  Time  Actions      │ │
│  ├──────────────────────────────────────────────────────┤ │
│  │ Alice Chen     ✅ Completed  85%   65m  [View Report]│ │
│  │ Bob Smith      🏃 In Progress -    30m  [Monitor]    │ │
│  │ Carol Lee      ✅ Completed  72%   89m  [View Report]│ │
│  │ Dave Kim       📧 Invited     -     -   [Remind]     │ │
│  │ Eve Martinez   ⏰ Expired     -     -   [Extend]     │ │
│  └──────────────────────────────────────────────────────┘ │
│                                                            │
│  [Export CSV] [Send Reminders] [Invite More]              │
└────────────────────────────────────────────────────────────┘
```

**Real-Time Updates:**
- WebSocket updates (when candidate starts, submits)
- Status indicators (invited, in progress, completed, expired)
- Sorting (by score, time, status)

**Actions:**
- **View Report:** See Glass Box analytics
- **Monitor:** Watch candidate's session live (if enabled)
- **Remind:** Send reminder email to candidates who haven't started
- **Extend:** Extend deadline for specific candidate

### 5.4 Candidate Assessment Experience

#### Assessment Start Page
**Layout:**
```
┌────────────────────────────────────────────────┐
│  Welcome to Acme Corp Technical Assessment     │
├────────────────────────────────────────────────┤
│  Assessment: Senior React Developer Test       │
│  Duration: 90 minutes                          │
│  Problems: 3 (1 Easy, 1 Medium, 1 System Design│
│                                                │
│  Instructions:                                 │
│  • Solve as many problems as you can          │
│  • You can attempt problems in any order      │
│  • Your progress is auto-saved                │
│  • You can pause and resume (timer continues) │
│  • Don't refresh the page unnecessarily       │
│                                                │
│  Ready to begin?                               │
│  [Start Assessment]                            │
│                                                │
│  Need help? [Contact Recruiter]               │
└────────────────────────────────────────────────┘
```

#### Assessment Interface
**Layout:**
```
┌───────────────────────────────────────────────────┐
│  ⏱ Time Remaining: 45:30   [Pause] [Submit All]  │
├───────────────────────────────────────────────────┤
│  Problems (Left Sidebar):                        │
│  1. ✅ Two Sum (Easy)          - Solved          │
│  2. 🔄 Fix Memory Leak (Med)   - In Progress     │
│  3. ⭕ Design Twitter (Hard)    - Not Started     │
├───────────────────────────────────────────────────┤
│  [Problem Description + Code Editor + Tests]     │
│  (Same as regular problem page)                  │
└───────────────────────────────────────────────────┘
```

**Key Differences from Practice Mode:**
- **Timer:** Countdown timer at top (always visible)
- **No Hints:** Hints disabled during assessment
- **No AI Tutor:** No access to AI help (configurable)
- **No Solutions:** Can't view solutions until submitted
- **Auto-Save:** Progress saved every 30 seconds
- **Auto-Submit:** Assessment auto-submits when timer runs out

**Tab Switch Warning:**
```
┌────────────────────────────────────────┐
│  ⚠ Warning                             │
│                                        │
│  You switched tabs 3 times.            │
│  This activity is being monitored.     │
│                                        │
│  Excessive tab switching may affect    │
│  your evaluation.                      │
│                                        │
│  [I Understand]                        │
└────────────────────────────────────────┘
```

**Assessment Submission:**
```
┌────────────────────────────────────────┐
│  Submit Assessment?                    │
│                                        │
│  Progress:                             │
│  • Problem 1: ✅ Solved                │
│  • Problem 2: ✅ Solved                │
│  • Problem 3: ⚠ Not attempted          │
│                                        │
│  Once submitted, you cannot make       │
│  changes. Are you sure?                │
│                                        │
│  [Go Back] [Submit Assessment]         │
└────────────────────────────────────────┘
```

### 5.5 Glass Box Analytics & Reporting

#### Candidate Report Page
**Layout:**
```
┌──────────────────────────────────────────────────────────┐
│  Candidate Report: Alice Chen                            │
│  Assessment: Senior React Developer Test                 │
│  Date: January 15, 2025                                  │
├──────────────────────────────────────────────────────────┤
│  Overall Score: 85%  🟢 Recommend for Interview          │
│                                                          │
│  Summary (AI-Generated):                                 │
│  "Alice demonstrated strong problem-solving skills and   │
│   efficient debugging. She solved 2/3 problems with     │
│   clean, well-structured code. Minimal tab switching    │
│   and no suspicious activity detected. Strong hire."    │
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Problem 1: Two Sum              ✅ Solved    (15m)   ││
│  │ • Time Complexity: O(n)         ✅ Optimal           ││
│  │ • Code Cleanliness: 9/10                            ││
│  │ • Test Runs: 3 (efficient debugging)                ││
│  │ [View Code] [Watch Playback]                        ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Problem 2: Fix Memory Leak      ✅ Solved    (50m)   ││
│  │ • Bug Located: Line 47 (listeners not removed)      ││
│  │ • Debugging Approach: Systematic, used print stmts  ││
│  │ • Code Churn: 1.8 (moderate rewrites)              ││
│  │ [View Code] [Watch Playback]                        ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  ┌──────────────────────────────────────────────────────┐│
│  │ Problem 3: Design Twitter       ⚠ Not Attempted     ││
│  └──────────────────────────────────────────────────────┘│
│                                                          │
│  Behavioral Metrics:                                     │
│  • Tab Switches: 2 (Low, acceptable)                    │
│  • Copy-Paste Events: 1 (small code snippet)           │
│  • Typing Speed: 250 CPM (normal)                      │
│  • Code Churn: 1.8 (moderate, shows iteration)         │
│                                                          │
│  Red Flags: None detected ✅                             │
│                                                          │
│  [Download PDF] [Share with Team] [Move to Next Stage]  │
└──────────────────────────────────────────────────────────┘
```

**Key Metrics Explained:**
- **Code Churn:** (Total chars typed) / (Final code length). 1.0 = perfect, >2.0 = many rewrites
- **Debug Efficiency:** Test runs / Successful submission. Lower = more confident
- **Typing Speed:** Chars per minute (detect abnormal spikes = pasting)

**Red Flags:**
- High code churn (>3.0) + low typing speed = likely pasted
- Excessive tab switching (>10) = getting help from other sources
- Code style shift = different person wrote parts of code

### 5.6 Live Monitoring (Optional)

**Feature:** Recruiter can watch candidate's session live (for high-stakes assessments)

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  Live Session: Bob Smith                                 │
│  Problem: Fix Memory Leak      Time Remaining: 45:00     │
├──────────────────────────────────────────────────────────┤
│  [Code Editor - Read-Only View]                          │
│  (Shows candidate's code in real-time)                   │
│                                                          │
│  Recent Activity:                                        │
│  • 10:15 - Opened cache.py                              │
│  • 10:20 - Added print statement at line 47             │
│  • 10:22 - Ran tests (1 failed)                         │
│  • 10:25 - Switched to browser tab (Warning triggered)  │
│                                                          │
│  [Stop Monitoring]                                       │
└──────────────────────────────────────────────────────────┘
```

**Privacy Note:** Notify candidate that session is being monitored

### 5.7 System Design Whiteboard (Assessment Mode)

**Feature:** For system design problems, provide collaborative whiteboard

**UI:**
```
┌──────────────────────────────────────────────────────────┐
│  Problem: Design Twitter                                 │
│                                                          │
│  [Whiteboard Canvas]                                     │
│  (Candidate draws architecture diagram)                  │
│                                                          │
│  Components:                                             │
│  • Load Balancer  • API Server  • Database             │
│  • Cache  • Message Queue  • CDN                        │
│                                                          │
│  [Submit Design]                                         │
└──────────────────────────────────────────────────────────┘
```

**Evaluation:**
- **Manually Reviewed:** Recruiter/Engineer reviews diagram
- **AI Scoring (Future):** AI evaluates completeness, scalability considerations

## 6. Anti-Cheating Measures

### 6.1 Detection Methods
1. **Tab Switch Tracking:** Count and log tab switches
2. **Copy-Paste Detection:** Detect large paste events, analyze code style shift
3. **Typing Speed Analysis:** Flag suspiciously high speeds (>500 CPM)
4. **Code Similarity:** Compare with previous submissions (plagiarism)
5. **Browser Fingerprinting:** Detect multiple accounts from same device

### 6.2 Response Actions
- **Warning:** Show warning after 5 tab switches
- **Flagging:** Mark session with red flag (for manual review)
- **Auto-Fail:** (Optional) Auto-fail if extreme cheating detected

### 6.3 Transparency
- **Candidate Notification:** "This assessment monitors tab switches and copy-paste activity"
- **No Hidden Cameras:** No webcam/screen recording (unless explicitly enabled)

## 7. Integrations

### 7.1 ATS (Applicant Tracking System) Integration
**Supported:** Greenhouse, Lever, Workable, BambooHR

**Flow:**
1. Recruiter creates job in ATS
2. Sends assessment via CodeSphere
3. Results automatically synced back to ATS
4. Update candidate stage: "Technical Assessment Passed"

### 7.2 Slack/Teams Notifications
**Alerts:**
- "Alice Chen completed assessment (Score: 85%)"
- "Bob Smith exceeded tab switch limit"
- "5 new assessment completions today"

## 8. Pricing (see Monetization PRD for details)

**Assessment Credits:**
- Starter: 50 assessments/month
- Growth: 200 assessments/month
- Enterprise: Unlimited

## 9. Non-Functional Requirements

### 9.1 Performance
- **Dashboard Load Time:** <2s
- **Real-Time Updates:** <1s latency (WebSocket)
- **Report Generation:** <5s for Glass Box report

### 9.2 Security
- **Unique Links:** One-time use tokens (prevents sharing)
- **Data Encryption:** All candidate data encrypted at rest
- **GDPR Compliance:** Candidates can request data deletion

## 10. Rollout Plan

### Phase 1: MVP (Week 1-3)
- Assessment creation (basic)
- Email invitations
- Assessment taking (same as problem page)
- Basic dashboard (candidate list, scores)

### Phase 2: Glass Box (Week 4-6)
- Keystroke tracking
- Tab switch detection
- AI-generated Glass Box reports

### Phase 3: Advanced Features (Week 7-9)
- Live monitoring
- System design whiteboard
- ATS integrations

### Phase 4: Enterprise (Week 10+)
- Custom branding
- Advanced analytics
- Multi-region compliance (EU data residency)

## 11. Success Criteria
- ✅ >70% assessment completion rate
- ✅ >60% interview conversion (pass assessment → pass interview)
- ✅ 20% faster time-to-hire for clients
- ✅ >50 NPS from recruiters
- ✅ >80% client retention after 1 year

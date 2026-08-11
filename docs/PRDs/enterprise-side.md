# Product Requirement Document (PRD): Enterprise Hiring Hub

**Target Audience:** Recruiters, Engineering Managers, CTOs

## 1. Overview {#overview}

The **Enterprise Hiring Hub** is the \"HackerRank\" alternative. It
allows companies to create, send, and analyze technical assessments. The
goal is **\"Signal over Noise\"**---reducing false positives (bad hires)
and false negatives (missed gems).

## 2. Key Features {#key-features}

### 2.1 The \"Glass Box\" Report {#the-glass-box-report}

- **Description:** Traditional reports just say \"Score: 80/100.\" The
  > Glass Box report analyzes the *metadata* of the session.

- **Metrics Tracked:**

  - **Code Churn:** Did they rewrite the same line 50 times? (Indicates
    > confusion).

  - **Paste Detection:** Did a large block of code appear instantly?
    > (Indicates cheating).

  - **Execution Behavior:** Did they run tests frequently to check
    > logic, or write the whole thing blindly?

- **Output:** An AI-generated summary paragraph: *\"Candidate struggled
  > initially with the recursion logic but demonstrated strong debugging
  > skills by isolating the error efficiently.\"*

### 2.2 Live System Design Whiteboard {#live-system-design-whiteboard}

- **Description:** A shared canvas for \"Architecting\" interviews
  > (e.g., \"Design Twitter\").

- **Tools:**

  - Standard Shapes (Load Balancer, Database, Cache, Client).

  - **Simulation Mode:** Users can draw lines connecting services and
    > click \"Simulate Traffic.\" The system visually shows where the
    > bottleneck would be (e.g., The Database turns red).

- **Requirements:** Real-time WebSocket synchronization.

### 2.3 Anti-Cheating 2.0 (The \"Honor Guard\") {#anti-cheating-2.0-the-honor-guard}

- **Description:** Advanced proctoring that respects privacy but ensures
  > integrity.

- **Features:**

  - **Browser Fingerprinting:** Detects if the user is running an LLM
    > extension or interacting with ChatGPT in another tab.

  - **Copy-Paste DNA:** Analyzes the style of pasted code. If the style
    > (indentation, variable naming) shifts drastically from the user\'s
    > previous code, flag it as suspicious.

## 3. User Flow (The Hiring Loop) {#user-flow-the-hiring-loop}

1.  **Job Setup:** Recruiter selects \"Senior React Dev\" role.

2.  **Test Generation:** System auto-generates a test: 1 Easy Algo, 1
    > React Debugging Task, 1 System Design Prompt.

3.  **Invite:** Candidate receives a magic link.

4.  **Proctoring:** Candidate takes test; system monitors tab focus and
    > clipboard.

5.  **Decision:** Recruiter gets an email: \"Candidate John Doe
    > finished. Recommended Action: **Interview** (Strong Debugging
    > Skills).\"

## 4. Success Metrics {#success-metrics}

- **Time-to-Hire:** Reduction in days for client companies.

- **Interview Conversion Rate:** % of candidates who pass the test and
  > *also* pass the human interview (validating the test\'s accuracy).

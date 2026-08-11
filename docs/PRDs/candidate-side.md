# Product Requirement Document (PRD): Candidate Learning Zone

**Target Audience:** Students, Job Seekers, Upskilling Developers

## 1. Overview {#overview}

The **Candidate Learning Zone** is the \"LeetCode\" alternative. It is
where users practice, learn, and track their progress. The core
philosophy is **\"Active Learning\"**---we don\'t just show the answer;
we guide the user to find it.

## 2. Key Features {#key-features}

### 2.1 The \"Real-World\" Lab (Killer Feature) {#the-real-world-lab-killer-feature}

- **Description:** Instead of just a function body def solve():, the
  > user is given a file tree (left sidebar) with App.js, Server.py,
  > Database.sql.

- **Scenario:** \"The server is returning a 500 error when the user
  > uploads a CSV. Locate the bug in Parser.py and fix it.\"

- **Requirements:**

  - Multi-file editor support.

  - Integrated Terminal (ReadOnly or Interactive).

  - \"Run Locally\" button that simulates a localhost server response.

### 2.2 The AI Socratic Tutor {#the-ai-socratic-tutor}

- **Description:** An AI chat interface that *refuses* to write code. It
  > only asks guiding questions.

- **Interaction Example:**

  - *User:* \"I\'m stuck, give me the answer.\"

  - *AI:* \"I can\'t do that. Have you checked what happens to the array
    > index when i reaches the end of the list? Try printing i inside
    > the loop.\"

- **Requirements:**

  - Context-aware (AI can read the user\'s current code).

  - Tone customization (Encouraging vs. Strict).

### 2.3 The \"Code Playback\" Review {#the-code-playback-review}

- **Description:** After solving a problem, users can watch a replay of
  > their own coding session at 10x speed.

- **Value:** Helps users see where they hesitated or wasted time.

- **Social:** Users can share their \"Playback\" to the community to
  > show off a fast solution.

## 3. User Flow (The Practice Loop) {#user-flow-the-practice-loop}

1.  **Dashboard:** AI recommends a problem based on user\'s weak spots
    > (e.g., \"You suck at Dynamic Programming, try this.\").

2.  **The Arena:** User enters the IDE.

3.  **The Struggle:** User codes, hits errors. Terminal shows meaningful
    > error logs (enhanced by AI explanation).

4.  **The Breakthrough:** User asks AI for a hint, fixes bug, passes
    > test cases.

5.  **The Review:** User sees their \"Efficiency Score\" (Time
    > Complexity + Code Cleanliness).

## 4. Success Metrics {#success-metrics}

- **Daily Active Users (DAU).**

- **Problem Completion Rate.**

- **\"Aha!\" Metric:** % of users who solve a problem after interacting
  > with the AI Tutor.

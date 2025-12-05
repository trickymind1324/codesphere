# PRD-02: Problem Solving & IDE Experience

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft
**Owner:** Product Team

## 1. Executive Summary

This PRD defines the core problem-solving experience for CodeSphere candidates, including the cloud IDE, code execution, test running, AI tutor integration, and solution submission. This is the **most critical feature** of the platform - where users spend 80% of their time.

## 2. Problem Statement

**User Pain Points:**
- **LeetCode:** Simple text editor, no file tree, can't test complex projects
- **HackerRank:** Limited language support, slow execution, no AI help
- **Local Setup:** Time-consuming, dependencies break, not portable

**Our Solution:**
- Full-featured cloud IDE (VS Code-like experience)
- Multi-file support for real-world scenarios
- Instant code execution with streaming output
- AI Socratic tutor for guidance (no answers)
- Code playback to review approach

## 3. Goals & Success Metrics

### 3.1 Goals
1. **Primary:** Enable candidates to solve coding problems efficiently in a modern IDE
2. **Secondary:** Provide real-world debugging scenarios (not just algorithms)
3. **Tertiary:** Guide learning with AI tutor (not just test pass/fail)

### 3.2 Success Metrics
- **Problem Completion Rate:** >40% of problems started are solved
- **Time to First Execution:** <30 seconds from problem page load
- **IDE Responsiveness:** <50ms typing latency
- **AI Tutor Engagement:** >30% of users ask for hints
- **User Satisfaction:** >4.5/5 stars for IDE experience

## 4. User Personas & Use Cases

### 4.1 Persona: Alex (Beginner Candidate)
**Needs:**
- Clear problem descriptions with examples
- Hints when stuck (without giving away solution)
- Understand why solution is wrong

**Use Cases:**
1. Read problem description, understand examples
2. Write initial solution, run test cases
3. Fix bugs based on test failures
4. Ask AI tutor "Why is my output different?"
5. Submit solution, see success

### 4.2 Persona: Jamie (Advanced Candidate)
**Needs:**
- Complex multi-file projects (real-world scenarios)
- Terminal access for debugging
- Fast code execution
- View optimal solutions after solving

**Use Cases:**
1. Open multi-file project (e.g., "Fix memory leak in Redis cache")
2. Navigate file tree, search for bug
3. Use terminal to run tests
4. Submit fix, compare with optimal solution

## 5. Functional Requirements

### 5.1 Problem Discovery & Selection

#### Problem List Page
**Components:**
- **Filter Bar:**
  - Difficulty: Easy / Medium / Hard (checkboxes)
  - Topics: Array, Hash Table, Dynamic Programming, etc. (multi-select dropdown)
  - Status: Todo / Attempted / Solved (tabs)
  - Companies: Filter by company (Google, Meta, Amazon, etc.)
- **Search Bar:** Search by problem title or description
- **Sort Options:** Acceptance Rate, Difficulty, Recently Added

**Problem Card:**
- Title (e.g., "Two Sum")
- Difficulty badge (color-coded: green/yellow/red)
- Acceptance rate (e.g., "45.3%")
- Tags (e.g., "array", "hash-table")
- Status icon (✅ solved, ⏳ attempted, blank = not started)
- Premium badge (if problem is premium)

**Interaction:**
- Click problem card → Navigate to problem page

#### Problem Page Layout
**Split View:**
```
┌────────────────────────────────────────────────┐
│  Problem Description (Left 40%)  │  Code Editor (Right 60%)  │
├────────────────────────────────────────────────┤
│  • Title                         │  • File Tree (sidebar)    │
│  • Difficulty                    │  • Editor Tabs            │
│  • Description (Markdown)        │  • Monaco Editor          │
│  • Examples                      │  • Run / Submit buttons   │
│  • Constraints                   │                           │
│  • Hints (collapsible)           │  Test Results (bottom)    │
│  • AI Tutor Chat (bottom)        │  • Test cases             │
└────────────────────────────────────────────────┘
```

**Resizable:** User can drag divider to adjust split

### 5.2 Problem Description Panel

**Content Structure:**
1. **Title & Metadata:**
   - Problem title (e.g., "Two Sum")
   - Difficulty badge
   - Acceptance rate
   - Total submissions
   - Tags
   - Companies that asked this question

2. **Description:** (Markdown format)
   - Problem statement
   - Examples with input/output
   - Constraints (e.g., `1 <= nums.length <= 10^4`)
   - Follow-up questions (e.g., "Can you do it in O(n) time?")

3. **Hints:** (Collapsible sections)
   - Hint 1: (visible after click)
   - Hint 2: (visible after click)
   - Hint 3: (visible after click)

4. **Related Topics:** Links to similar problems

**Example Format:**
```markdown
## Example 1:
**Input:** nums = [2,7,11,15], target = 9
**Output:** [0,1]
**Explanation:** nums[0] + nums[1] == 9, so we return [0, 1].

## Example 2:
**Input:** nums = [3,2,4], target = 6
**Output:** [1,2]
```

### 5.3 Code Editor (Monaco Editor)

#### Features:
- **Syntax Highlighting:** All supported languages
- **Auto-completion:** IntelliSense for standard libraries
- **Linting:** Real-time error detection (syntax errors)
- **Code Formatting:** Format button (Prettier for JS, Black for Python, etc.)
- **Multi-cursor Editing:** Alt+Click to add cursors
- **Minimap:** Code overview on right side (like VS Code)
- **Line Numbers:** Always visible
- **Bracket Matching:** Highlight matching brackets

#### Language Selection:
- **Dropdown:** Select language (Python, JavaScript, Java, C++, Go, Rust, SQL)
- **Persisted:** Remember user's last-used language per problem
- **Starter Code:** Each problem provides starter code template per language

**Example Starter Code (Python):**
```python
def two_sum(nums: List[int], target: int) -> List[int]:
    """
    :type nums: List[int]
    :type target: int
    :rtype: List[int]
    """
    # Your code here
    pass
```

#### File Tree (Multi-File Projects)
**Use Case:** Real-world debugging scenarios

**Example Structure:**
```
📁 project-root
├── 📄 main.py         (entrypoint)
├── 📄 cache.py        (module with bug)
├── 📄 test_cache.py   (unit tests)
└── 📄 README.md       (problem description)
```

**Interactions:**
- Click file → Open in editor tab
- Right-click file → Rename, Delete (if allowed)
- Double-click folder → Expand/collapse

#### Editor Tabs
- **Multiple Open Files:** Tabs for each open file
- **Close Tab:** X button on tab
- **Modified Indicator:** Dot on tab if unsaved changes
- **Auto-Save:** Save to IndexedDB every 5 seconds

### 5.4 Code Execution & Testing

#### Run Button
**Behavior:**
1. User clicks "Run" button (or Ctrl+Enter)
2. Show loading spinner on button
3. Send code to backend `/api/v1/execute` endpoint
4. Stream output via WebSocket to Output Panel
5. Display stdout, stderr, execution time

**Output Panel:**
```
┌────────────────────────────────────────┐
│  Console Output                        │
├────────────────────────────────────────┤
│  > Running code...                     │
│  Hello, World!                         │
│  ✅ Execution completed in 120ms       │
│  Memory: 45 MB                         │
└────────────────────────────────────────┘
```

#### Test Cases Panel
**Layout:**
```
┌───────────────────────────────────────────────┐
│  Test Cases                                   │
├───────────────────────────────────────────────┤
│  ✅ Test Case 1: nums=[2,7,11,15], target=9  │
│     Output: [0,1]   Expected: [0,1]          │
│                                               │
│  ❌ Test Case 2: nums=[3,2,4], target=6      │
│     Output: [1,3]   Expected: [1,2]          │
│     Time: 50ms                                │
│                                               │
│  + Add Custom Test Case                       │
└───────────────────────────────────────────────┘
```

**Features:**
- **Public Test Cases:** Shown upfront (2-3 cases)
- **Custom Test Cases:** User can add their own inputs to test
- **Hidden Test Cases:** Only revealed after submission (anti-cheating)
- **Expand/Collapse:** Click test case to see full input/output

#### Submit Button
**Behavior:**
1. User clicks "Submit" button
2. Run all test cases (public + hidden)
3. Show progress: "Running 10 test cases..."
4. Display results:
   - ✅ All Passed → Show success modal with stats (runtime, memory)
   - ❌ Some Failed → Show first failing test case
5. Save submission to database
6. Update user progress (mark problem as solved if all passed)

**Success Modal:**
```
┌─────────────────────────────────────────┐
│  ✅ Accepted!                           │
│                                         │
│  Runtime: 120ms (faster than 85%)      │
│  Memory: 45MB (better than 60%)        │
│                                         │
│  [View Solutions] [Next Problem]       │
└─────────────────────────────────────────┘
```

### 5.5 AI Socratic Tutor

**Location:** Bottom of problem description panel (collapsible chat)

**UI:**
```
┌────────────────────────────────────────┐
│  💬 Ask the Tutor                      │
├────────────────────────────────────────┤
│  [User] Why is my code timing out?     │
│                                        │
│  [Tutor] Your code checks every pair,  │
│  which is O(n²). Can you think of a   │
│  way to check if a number exists in   │
│  constant time? Hint: What data       │
│  structure allows O(1) lookups?       │
│                                        │
│  [User] Should I use a hash map?       │
│                                        │
│  [Tutor] Yes! Try storing numbers as  │
│  you iterate. What would you store as │
│  the key and value?                   │
├────────────────────────────────────────┤
│  Type your question...      [Send]     │
└────────────────────────────────────────┘
```

**Features:**
- **Context-Aware:** AI sees problem description + user's current code
- **Socratic:** Never gives direct answers, only guiding questions
- **Tone Selector:** User can choose tone (Encouraging / Neutral / Strict)
- **Rate Limit:** Free tier: 10 hints/day, Pro: Unlimited
- **Thumbs Up/Down:** Feedback on AI response quality

**Example Interaction:**
```
User: "I'm stuck. Give me the solution."
AI: "I can't give you the solution, but I can help you discover it!
     Let's break this down: What are you trying to find in the array?"
```

### 5.6 Solutions & Discussions (Post-Solve)

**Unlock Condition:** Only after solving problem or giving up (3 failed submissions)

**Solutions Tab:**
- **Official Solution:** Editorial written by problem author
  - Approach explanation (multiple approaches)
  - Code implementation (all languages)
  - Time/space complexity analysis
- **Top Submissions:** Fastest/most elegant solutions from community
  - Upvote/downvote
  - Comments
- **My Submissions:** User's past attempts
  - Code playback (watch typing replay at 10x speed)

**Discussions Tab:**
- **Forum:** Reddit-style discussions
- **Sort:** Most upvoted, Recent, Unanswered
- **Ask Question:** User can post questions
- **Mark as Answer:** OP can mark helpful answers

### 5.7 Code Playback

**Feature:** Watch a replay of your coding session

**UI:**
```
┌────────────────────────────────────────┐
│  📹 Code Playback                      │
├────────────────────────────────────────┤
│  [▶ Play] [⏸ Pause] [⏩ 10x Speed]     │
│                                        │
│  Timeline: ████████░░░░░░░░░░  50%    │
│  Time: 5:30 / 10:45                    │
│                                        │
│  [Editor shows code appearing as typed]│
│                                        │
│  Events:                               │
│  • 0:30 - Started typing               │
│  • 2:15 - Ran first test               │
│  • 4:00 - Long pause (thinking)        │
│  • 7:30 - Asked AI tutor               │
│  • 10:45 - Submitted solution          │
└────────────────────────────────────────┘
```

**Use Cases:**
- **Self-Review:** See where you wasted time or made mistakes
- **Social Sharing:** Share impressive speed-solve on Twitter
- **Learning:** Watch others' approaches

## 6. Real-World Debugging Scenarios

**What Makes This Different:**
- Instead of "Reverse a Linked List", user gets:
  - "Fix the memory leak in this Redis cache implementation"
  - "Debug the race condition in this concurrent task queue"
  - "Optimize the slow SQL query in this analytics dashboard"

**Example Scenario:**
```
Problem: Memory Leak in Redis Cache

Files:
- cache.py (has the bug)
- test_cache.py (failing tests)
- README.md (description)

Description:
"This Redis cache is leaking memory. After 10,000 operations, memory
usage grows to 500MB. Find and fix the leak."

Hints:
1. Check if expired keys are being deleted
2. Look at the eviction policy
3. Are listeners being cleaned up?
```

**User Flow:**
1. Read README.md to understand the bug
2. Open cache.py, look for suspicious code
3. Run test_cache.py to see failures
4. Add print statements to debug
5. Fix bug, run tests again
6. Submit fix

## 7. Terminal Integration (Advanced)

**Feature:** Embedded terminal (xterm.js) for power users

**Use Cases:**
- Run custom commands (`python main.py`, `npm test`)
- Install packages (`pip install numpy`)
- Debug with REPL (`python` interactive shell)

**UI:**
```
┌────────────────────────────────────────┐
│  Terminal (bash)                       │
├────────────────────────────────────────┤
│  $ python main.py                      │
│  Hello, World!                         │
│  $ pip list                            │
│  numpy==1.24.0                         │
│  $ _                                   │
└────────────────────────────────────────┘
```

**Limitations:**
- Read-only file system (except /tmp)
- No sudo access
- No network access (except whitelisted APIs)
- 5-minute session timeout

## 8. Non-Functional Requirements

### 8.1 Performance
- **Editor Typing Latency:** <50ms (no lag)
- **Code Execution:** First output <500ms
- **Page Load:** <2s (editor ready to type)
- **Syntax Highlighting:** Instant (Web Workers for large files)

### 8.2 Offline Support (PWA)
- **Cache Problem Data:** IndexedDB stores problems
- **Offline Editing:** Code saves locally, syncs when online
- **Service Worker:** Preload problems for offline access

### 8.3 Accessibility
- **Keyboard Navigation:** Tab through all interactive elements
- **Screen Reader:** ARIA labels for all buttons
- **High Contrast Mode:** Support OS-level high contrast
- **Font Size:** User can adjust (Ctrl+Plus/Minus)

## 9. Edge Cases & Error Handling

### 9.1 Code Execution Timeout
**Scenario:** User submits infinite loop
**Handling:** Kill after 5 seconds, show "Time Limit Exceeded" error

### 9.2 Memory Limit Exceeded
**Scenario:** User allocates 10GB array
**Handling:** Kill process, show "Memory Limit Exceeded" error

### 9.3 Compilation Error
**Scenario:** User submits code with syntax errors (Java, C++)
**Handling:** Show compilation error message with line number

### 9.4 Network Failure During Submit
**Scenario:** User clicks submit, but network fails
**Handling:** Retry automatically (3 attempts), show "Submission failed. Retry?"

## 10. Privacy & Data Retention

**Code Storage:**
- All submissions saved permanently (for progress tracking)
- User can delete submission from history

**Playback Data:**
- Keystroke data stored for 30 days (after that, deleted)
- User can opt-out of keystroke tracking

## 11. Rollout Plan

### Phase 1: MVP (Week 1-2)
- Problem list page (filter, search, sort)
- Problem page with description + Monaco editor
- Code execution (single file)
- Test case runner

### Phase 2: Enhanced IDE (Week 3-4)
- Multi-file support
- File tree navigation
- Terminal integration
- Code formatting

### Phase 3: AI & Social (Week 5-6)
- AI Socratic tutor
- Solutions & discussions
- Code playback

### Phase 4: Real-World Scenarios (Week 7+)
- Debugging challenges
- System design integration
- Localhost preview (for web projects)

## 12. Success Criteria
- ✅ >40% problem completion rate
- ✅ <50ms editor typing latency
- ✅ >30% AI tutor engagement
- ✅ >4.5/5 user satisfaction rating
- ✅ 10,000+ problems solved per month (at scale)

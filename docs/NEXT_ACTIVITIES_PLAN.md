# Next Activities Plan - Assessment System Frontend

**Document Version:** 1.0
**Created:** January 3, 2026
**Priority:** CRITICAL - Only remaining MVP blocker

---

## Executive Summary

**Current Status:** 92% MVP Complete
**Remaining Work:** Assessment System Frontend (0%)
**Estimated Effort:** 2 weeks
**Backend Status:** 100% Complete ✅

**What's Blocking MVP Launch:**
- Recruiter cannot create assessments (no UI)
- Recruiter cannot invite candidates (no UI)
- Recruiter cannot view results (no UI)
- Candidates cannot take assessments (no flow)

**Backend Already Complete:**
- ✅ All 17 API endpoints working
- ✅ Email service configured
- ✅ Token-based invitation system
- ✅ Assessment CRUD operations
- ✅ Results tracking and statistics

---

## Phase 1: Foundation & API Integration (Days 1-3)

### Day 1: API Client & Types Setup

**Goal:** Create TypeScript API client and shared types

**Tasks:**
1. Create `frontend/src/api/assessment.api.ts`
   - Assessment CRUD methods
   - Invitation methods
   - Results fetching methods
   - Problem management methods

2. Create `frontend/src/types/assessment.types.ts`
   ```typescript
   // Assessment types
   interface Assessment {
     id: string;
     title: string;
     description: string;
     duration: number; // minutes
     status: 'draft' | 'published' | 'archived';
     createdBy: string;
     createdAt: Date;
     updatedAt: Date;
   }

   interface AssessmentProblem {
     id: string;
     assessmentId: string;
     problemId: string;
     order: number;
     points: number;
     problem?: Problem; // populated from problem service
   }

   interface AssessmentInvitation {
     id: string;
     assessmentId: string;
     email: string;
     uniqueToken: string;
     status: 'pending' | 'started' | 'completed' | 'expired';
     expiresAt: Date;
     startedAt?: Date;
     completedAt?: Date;
     score?: number;
   }

   interface AssessmentStatistics {
     totalInvitations: number;
     completedCount: number;
     averageScore: number;
     completionRate: number;
   }
   ```

3. Create React Query hooks in `frontend/src/hooks/useAssessments.ts`
   - `useAssessments()` - List all assessments
   - `useAssessment(id)` - Get single assessment
   - `useCreateAssessment()` - Create mutation
   - `useUpdateAssessment()` - Update mutation
   - `useDeleteAssessment()` - Delete mutation
   - `useInviteCandidates()` - Send invitations
   - `useAssessmentResults()` - Get results

**Deliverables:**
- ✅ assessment.api.ts with all methods
- ✅ assessment.types.ts with TypeScript interfaces
- ✅ useAssessments.ts with React Query hooks
- ✅ All API calls tested with existing backend

**Testing:**
```bash
# Test API calls in browser console
curl http://localhost:8003/api/v1/assessments
```

---

## Phase 2: Recruiter Dashboard (Days 4-6)

### Day 4: Dashboard Layout & Assessment List

**Goal:** Build main recruiter dashboard page

**File:** `frontend/src/pages/RecruiterDashboard.tsx`

**Features:**
1. Assessment list table
   - Columns: Title, Status, Problems, Invitations, Completion Rate, Created
   - Status badges (draft/published/archived)
   - Click to view details

2. Statistics cards
   - Total Assessments
   - Active Assessments
   - Total Invitations Sent
   - Average Completion Rate

3. Action buttons
   - "Create Assessment" (primary CTA)
   - Filter by status dropdown
   - Search by title

**Component Structure:**
```typescript
<RecruiterDashboard>
  <PageHeader>
    <h1>Assessments</h1>
    <Button onClick={navigate to create}>Create Assessment</Button>
  </PageHeader>

  <StatisticsCards>
    <StatCard title="Total Assessments" value={count} />
    <StatCard title="Active" value={activeCount} />
    <StatCard title="Invitations Sent" value={inviteCount} />
    <StatCard title="Avg Completion" value={completionRate} />
  </StatisticsCards>

  <FiltersBar>
    <SearchInput placeholder="Search assessments..." />
    <StatusFilter options={['all', 'draft', 'published', 'archived']} />
  </FiltersBar>

  <AssessmentTable>
    {assessments.map(assessment => (
      <AssessmentRow
        key={assessment.id}
        assessment={assessment}
        onEdit={handleEdit}
        onDelete={handleDelete}
        onInvite={handleInvite}
        onViewResults={handleViewResults}
      />
    ))}
  </AssessmentTable>
</RecruiterDashboard>
```

**Routing:**
```typescript
// Add to frontend/src/App.tsx
<Route path="/recruiter/dashboard" element={<RecruiterDashboard />} />
```

**Deliverables:**
- ✅ RecruiterDashboard.tsx with full UI
- ✅ Statistics cards showing real data
- ✅ Assessment list with actions
- ✅ Empty state when no assessments
- ✅ Loading and error states

---

### Day 5: Assessment Creation Form

**Goal:** Build assessment creation/editing form

**File:** `frontend/src/pages/AssessmentForm.tsx`

**Form Fields:**
1. Title (required, max 200 chars)
2. Description (optional, textarea, max 1000 chars)
3. Duration (required, number input, 15-180 minutes)
4. Status (draft/published radio buttons)
5. Problem Selection (multi-select with search)

**Component Structure:**
```typescript
<AssessmentForm>
  <FormSection title="Basic Information">
    <Input
      label="Assessment Title"
      name="title"
      required
      placeholder="e.g., Full-Stack Developer Assessment"
    />

    <Textarea
      label="Description"
      name="description"
      placeholder="Describe what this assessment evaluates..."
    />

    <NumberInput
      label="Duration (minutes)"
      name="duration"
      min={15}
      max={180}
      step={15}
      default={60}
    />

    <RadioGroup label="Status" name="status">
      <Radio value="draft">Draft</Radio>
      <Radio value="published">Published</Radio>
    </RadioGroup>
  </FormSection>

  <FormSection title="Select Problems">
    <ProblemSelector
      selectedProblems={selectedProblems}
      onSelect={handleProblemSelect}
      onRemove={handleProblemRemove}
      onReorder={handleProblemReorder}
    />
  </FormSection>

  <FormActions>
    <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
    <Button variant="primary" type="submit">
      {isEdit ? 'Update Assessment' : 'Create Assessment'}
    </Button>
  </FormActions>
</AssessmentForm>
```

**Validation Rules:**
- Title: Required, 3-200 characters
- Duration: 15-180 minutes
- Problems: Minimum 1, maximum 20
- At least one problem must be selected

**Routing:**
```typescript
<Route path="/recruiter/assessments/new" element={<AssessmentForm />} />
<Route path="/recruiter/assessments/:id/edit" element={<AssessmentForm />} />
```

**Deliverables:**
- ✅ AssessmentForm.tsx with validation
- ✅ Form state management (React Hook Form or Formik)
- ✅ Auto-save to draft functionality
- ✅ Success/error toast notifications
- ✅ Redirect to dashboard on success

---

### Day 6: Problem Selector Component

**Goal:** Build reusable problem selector with search and ordering

**File:** `frontend/src/components/features/assessment/ProblemSelector.tsx`

**Features:**
1. Search problems by title
2. Filter by difficulty (Easy/Medium/Hard)
3. Filter by tags
4. Multi-select problems
5. Drag-and-drop to reorder selected problems
6. Set points for each problem

**Component Structure:**
```typescript
<ProblemSelector>
  <SearchAndFilters>
    <SearchInput
      placeholder="Search problems..."
      value={searchQuery}
      onChange={setSearchQuery}
    />

    <DifficultyFilter
      selected={difficultyFilter}
      onChange={setDifficultyFilter}
    />

    <TagFilter
      tags={availableTags}
      selected={tagFilter}
      onChange={setTagFilter}
    />
  </SearchAndFilters>

  <TwoColumnLayout>
    <AvailableProblems>
      <h3>Available Problems ({filteredProblems.length})</h3>
      <ProblemList>
        {filteredProblems.map(problem => (
          <ProblemCard
            key={problem.id}
            problem={problem}
            onAdd={() => handleAddProblem(problem)}
            isSelected={isSelected(problem.id)}
          />
        ))}
      </ProblemList>
    </AvailableProblems>

    <SelectedProblems>
      <h3>Selected Problems ({selectedProblems.length})</h3>
      <DraggableProblemList
        problems={selectedProblems}
        onReorder={handleReorder}
        onRemove={handleRemove}
        onPointsChange={handlePointsChange}
      />

      <TotalPoints>Total Points: {totalPoints}</TotalPoints>
    </SelectedProblems>
  </TwoColumnLayout>
</ProblemSelector>
```

**Libraries Needed:**
- `@dnd-kit/core` and `@dnd-kit/sortable` for drag-and-drop
- React Query for problem fetching

**Deliverables:**
- ✅ ProblemSelector.tsx with search/filter
- ✅ Drag-and-drop reordering
- ✅ Points assignment per problem
- ✅ Visual feedback for selections
- ✅ Validation (min 1, max 20 problems)

---

## Phase 3: Invitation & Results (Days 7-9)

### Day 7: Invitation Management Page

**Goal:** Build invitation sending interface

**File:** `frontend/src/pages/InvitationPage.tsx`

**Features:**
1. Bulk email input (textarea or CSV upload)
2. Custom invitation message template
3. Expiry date selector
4. Preview invitation email
5. Send invitations button

**Component Structure:**
```typescript
<InvitationPage assessmentId={assessmentId}>
  <PageHeader>
    <h1>Invite Candidates</h1>
    <AssessmentInfo assessment={assessment} />
  </PageHeader>

  <InvitationForm onSubmit={handleSendInvitations}>
    <FormSection title="Candidate Emails">
      <EmailInput
        mode="bulk" // textarea or CSV
        emails={emails}
        onChange={setEmails}
        placeholder="Enter emails (one per line or comma-separated)"
      />

      <FileUpload
        accept=".csv"
        onUpload={handleCSVUpload}
        label="Or upload CSV"
      />

      <EmailPreview>
        <strong>{validEmails.length}</strong> valid emails
        {invalidEmails.length > 0 && (
          <ErrorList emails={invalidEmails} />
        )}
      </EmailPreview>
    </FormSection>

    <FormSection title="Invitation Settings">
      <DatePicker
        label="Expires On"
        name="expiresAt"
        min={new Date()}
        default={addDays(new Date(), 7)}
      />

      <Textarea
        label="Custom Message (Optional)"
        name="customMessage"
        placeholder="Add a personal message to the invitation email..."
      />
    </FormSection>

    <FormSection title="Email Preview">
      <EmailPreview
        template={invitationTemplate}
        customMessage={customMessage}
        assessmentTitle={assessment.title}
      />
    </FormSection>

    <FormActions>
      <Button variant="secondary" onClick={handleCancel}>Cancel</Button>
      <Button
        variant="primary"
        type="submit"
        disabled={validEmails.length === 0}
      >
        Send {validEmails.length} Invitation{validEmails.length !== 1 ? 's' : ''}
      </Button>
    </FormActions>
  </InvitationForm>

  <PreviousInvitations>
    <h2>Previous Invitations</h2>
    <InvitationTable
      invitations={previousInvitations}
      onResend={handleResend}
    />
  </PreviousInvitations>
</InvitationPage>
```

**Email Validation:**
- Use regex for email validation
- Check for duplicates
- Show count of valid vs invalid

**Routing:**
```typescript
<Route path="/recruiter/assessments/:id/invite" element={<InvitationPage />} />
```

**Deliverables:**
- ✅ InvitationPage.tsx with email input
- ✅ Bulk email parsing and validation
- ✅ CSV upload support
- ✅ Email preview component
- ✅ Success confirmation with sent count
- ✅ Previous invitations list with resend

---

### Day 8-9: Results Dashboard

**Goal:** Build results viewing and analysis interface

**File:** `frontend/src/pages/ResultsPage.tsx`

**Features:**
1. Candidate results table
2. Score distribution chart
3. Problem-wise performance
4. Filter by status (all/completed/in-progress)
5. Export to CSV

**Component Structure:**
```typescript
<ResultsPage assessmentId={assessmentId}>
  <PageHeader>
    <h1>Assessment Results</h1>
    <AssessmentInfo assessment={assessment} />
  </PageHeader>

  <StatisticsOverview>
    <StatCard title="Total Invited" value={stats.totalInvitations} />
    <StatCard title="Completed" value={stats.completedCount} />
    <StatCard title="In Progress" value={stats.inProgressCount} />
    <StatCard title="Average Score" value={`${stats.averageScore}%`} />
    <StatCard title="Completion Rate" value={`${stats.completionRate}%`} />
  </StatisticsOverview>

  <ChartsSection>
    <ScoreDistributionChart data={scoreDistribution} />
    <ProblemPerformanceChart data={problemStats} />
  </ChartsSection>

  <FiltersAndActions>
    <StatusFilter
      value={statusFilter}
      onChange={setStatusFilter}
      options={['all', 'completed', 'in-progress', 'not-started']}
    />

    <SearchInput
      placeholder="Search by email..."
      value={searchQuery}
      onChange={setSearchQuery}
    />

    <Button
      variant="secondary"
      onClick={handleExportCSV}
      icon={<DownloadIcon />}
    >
      Export CSV
    </Button>
  </FiltersAndActions>

  <ResultsTable>
    <thead>
      <tr>
        <th>Candidate Email</th>
        <th>Status</th>
        <th>Score</th>
        <th>Problems Solved</th>
        <th>Time Taken</th>
        <th>Completed At</th>
        <th>Actions</th>
      </tr>
    </thead>
    <tbody>
      {filteredResults.map(result => (
        <ResultRow
          key={result.id}
          result={result}
          onViewDetail={handleViewDetail}
        />
      ))}
    </tbody>
  </ResultsTable>
</ResultsPage>
```

**Charts Library:**
- Use Recharts or Chart.js for visualizations
- Score distribution histogram
- Problem performance bar chart

**CSV Export Format:**
```csv
Email,Status,Score,Problems Solved,Time Taken,Started At,Completed At
candidate@example.com,completed,85,8/10,45m,2026-01-01 10:00,2026-01-01 10:45
```

**Routing:**
```typescript
<Route path="/recruiter/assessments/:id/results" element={<ResultsPage />} />
```

**Deliverables:**
- ✅ ResultsPage.tsx with statistics
- ✅ Results table with sorting
- ✅ Charts for score distribution
- ✅ CSV export functionality
- ✅ Detailed view modal for individual candidate

---

## Phase 4: Candidate Assessment Flow (Days 10-12)

### Day 10: Assessment Landing Page

**Goal:** Build candidate-facing assessment start page

**File:** `frontend/src/pages/AssessmentLanding.tsx`

**Features:**
1. Token validation
2. Assessment details display
3. Start assessment button
4. Handle expired/invalid tokens

**Component Structure:**
```typescript
<AssessmentLanding token={token}>
  {isValidating && <LoadingSpinner />}

  {isInvalid && (
    <ErrorState
      title="Invalid or Expired Link"
      message="This assessment link is no longer valid."
    />
  )}

  {isValid && invitation.status === 'completed' && (
    <CompletedState
      message="You have already completed this assessment."
      score={invitation.score}
    />
  )}

  {isValid && invitation.status !== 'completed' && (
    <AssessmentInfo>
      <Header>
        <h1>{assessment.title}</h1>
        <Badge>Duration: {assessment.duration} minutes</Badge>
      </Header>

      <Description>{assessment.description}</Description>

      <InstructionsList>
        <h2>Instructions</h2>
        <ul>
          <li>You have {assessment.duration} minutes to complete {assessment.problems.length} problems</li>
          <li>The timer will start when you click "Begin Assessment"</li>
          <li>Your progress is automatically saved</li>
          <li>The assessment will auto-submit when time expires</li>
          <li>You can navigate between problems freely</li>
        </ul>
      </InstructionsList>

      <ProblemsList>
        <h2>Problems ({assessment.problems.length})</h2>
        {assessment.problems.map((problem, index) => (
          <ProblemCard
            key={problem.id}
            number={index + 1}
            title={problem.title}
            difficulty={problem.difficulty}
            points={problem.points}
          />
        ))}
      </ProblemsList>

      <Actions>
        <Checkbox
          checked={agreedToTerms}
          onChange={setAgreedToTerms}
          label="I understand the instructions and agree to the terms"
        />

        <Button
          variant="primary"
          size="large"
          onClick={handleStartAssessment}
          disabled={!agreedToTerms}
        >
          {invitation.status === 'started'
            ? 'Resume Assessment'
            : 'Begin Assessment'}
        </Button>
      </Actions>
    </AssessmentInfo>
  )}
</AssessmentLanding>
```

**Flow:**
1. Parse token from URL: `/assessment/:token`
2. Call `GET /api/v1/invitations/:token` to validate
3. Show assessment details
4. On "Begin", call `POST /api/v1/invitations/:token/start`
5. Redirect to `/assessment/:token/problem/1`

**Routing:**
```typescript
<Route path="/assessment/:token" element={<AssessmentLanding />} />
```

**Deliverables:**
- ✅ AssessmentLanding.tsx with validation
- ✅ Token validation on mount
- ✅ Assessment details display
- ✅ Start button with confirmation
- ✅ Resume support for started assessments
- ✅ Error handling for invalid tokens

---

### Day 11: Assessment Timer Component

**Goal:** Build countdown timer with auto-submit

**File:** `frontend/src/components/features/assessment/AssessmentTimer.tsx`

**Features:**
1. Countdown display (MM:SS format)
2. Warning at 5 minutes remaining
3. Auto-submit when time expires
4. Persist timer state to localStorage
5. Resume from saved state on page refresh

**Component Structure:**
```typescript
<AssessmentTimer
  duration={durationInMinutes}
  startedAt={startedAt}
  onTimeExpired={handleAutoSubmit}
  onWarning={handleWarning}
>
  <TimerDisplay>
    <ClockIcon />
    <TimeRemaining className={isWarning ? 'warning' : ''}>
      {formatTime(timeRemaining)}
    </TimeRemaining>
  </TimerDisplay>

  {isWarning && (
    <WarningBanner>
      ⚠️ Less than 5 minutes remaining!
    </WarningBanner>
  )}
</AssessmentTimer>
```

**Timer Logic:**
```typescript
const AssessmentTimer = ({ duration, startedAt, onTimeExpired }) => {
  const [timeRemaining, setTimeRemaining] = useState(0);

  useEffect(() => {
    // Calculate elapsed time
    const elapsed = Date.now() - new Date(startedAt).getTime();
    const totalDuration = duration * 60 * 1000; // convert to ms
    const remaining = totalDuration - elapsed;

    if (remaining <= 0) {
      onTimeExpired();
      return;
    }

    setTimeRemaining(remaining);

    // Update every second
    const interval = setInterval(() => {
      const newRemaining = remaining - (Date.now() - startedAt);

      if (newRemaining <= 0) {
        clearInterval(interval);
        onTimeExpired();
      } else {
        setTimeRemaining(newRemaining);

        // Warning at 5 minutes
        if (newRemaining <= 5 * 60 * 1000 && !hasWarned) {
          onWarning?.();
          setHasWarned(true);
        }
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [duration, startedAt]);

  const formatTime = (ms) => {
    const totalSeconds = Math.floor(ms / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes}:${seconds.toString().padStart(2, '0')}`;
  };

  return <TimerDisplay>{formatTime(timeRemaining)}</TimerDisplay>;
};
```

**Auto-Submit Logic:**
- When timer reaches 0, automatically submit all answers
- Show "Time's Up!" modal before submitting
- Call completion API endpoint

**Deliverables:**
- ✅ AssessmentTimer.tsx component
- ✅ Countdown logic with accuracy
- ✅ Warning at 5 minutes
- ✅ Auto-submit on expiry
- ✅ Timer state persistence
- ✅ Visual warning indicators

---

### Day 12: Assessment IDE Integration

**Goal:** Build time-limited problem solving interface

**File:** `frontend/src/pages/AssessmentIDE.tsx`

**Features:**
1. Reuse existing ProblemDetailPage IDE
2. Add assessment timer to header
3. Restrict navigation to assessment problems only
4. Save progress automatically
5. Submit assessment button

**Component Structure:**
```typescript
<AssessmentIDE token={token} problemIndex={problemIndex}>
  <AssessmentHeader>
    <AssessmentInfo>
      <h2>{assessment.title}</h2>
      <Badge>Problem {currentIndex + 1} of {totalProblems}</Badge>
    </AssessmentInfo>

    <AssessmentTimer
      duration={assessment.duration}
      startedAt={invitation.startedAt}
      onTimeExpired={handleAutoSubmit}
    />

    <ExitButton onClick={handleConfirmExit}>
      Exit Assessment
    </ExitButton>
  </AssessmentHeader>

  <AssessmentNavigation>
    {assessment.problems.map((problem, index) => (
      <ProblemTab
        key={problem.id}
        number={index + 1}
        title={problem.title}
        status={getSubmissionStatus(problem.id)}
        active={index === currentIndex}
        onClick={() => navigateToProblem(index)}
      />
    ))}
  </AssessmentNavigation>

  <ProblemContent>
    <ProblemDetailPanel problem={currentProblem} />

    <CodeEditorPanel>
      <MonacoEditor
        language={selectedLanguage}
        code={code}
        onChange={handleCodeChange}
        onRun={handleRunCode}
        onSubmit={handleSubmitProblem}
      />
    </CodeEditorPanel>
  </ProblemContent>

  <AssessmentFooter>
    <NavigationButtons>
      <Button
        variant="secondary"
        onClick={handlePrevious}
        disabled={currentIndex === 0}
      >
        ← Previous
      </Button>

      <Button
        variant="secondary"
        onClick={handleNext}
        disabled={currentIndex === totalProblems - 1}
      >
        Next →
      </Button>
    </NavigationButtons>

    <SubmitButton>
      <Button
        variant="primary"
        size="large"
        onClick={handleSubmitAssessment}
      >
        Submit Assessment
      </Button>
    </SubmitButton>
  </AssessmentFooter>
</AssessmentIDE>
```

**Key Differences from Regular IDE:**
- Navigation restricted to assessment problems only
- Timer always visible in header
- Auto-save on every code change
- Cannot access other problems outside assessment
- Submit assessment confirmation dialog

**Routing:**
```typescript
<Route path="/assessment/:token/problem/:index" element={<AssessmentIDE />} />
```

**Auto-Save Logic:**
```typescript
// Debounce auto-save by 2 seconds
const debouncedSave = useDebounce(code, 2000);

useEffect(() => {
  if (debouncedSave) {
    saveProgress({
      token,
      problemId: currentProblem.id,
      code: debouncedSave,
      language: selectedLanguage,
    });
  }
}, [debouncedSave]);
```

**Submit Confirmation:**
```typescript
const handleSubmitAssessment = () => {
  const solvedCount = submissions.filter(s => s.status === 'ACCEPTED').length;
  const totalProblems = assessment.problems.length;

  confirm({
    title: 'Submit Assessment?',
    message: `You have solved ${solvedCount} out of ${totalProblems} problems. Are you sure you want to submit?`,
    confirmText: 'Submit Assessment',
    onConfirm: async () => {
      await completeAssessment(token);
      navigate(`/assessment/${token}/completed`);
    },
  });
};
```

**Deliverables:**
- ✅ AssessmentIDE.tsx with timer
- ✅ Problem navigation (assessment only)
- ✅ Auto-save progress
- ✅ Submit assessment flow
- ✅ Time expiry handling
- ✅ Exit confirmation dialog

---

## Phase 5: Polish & Testing (Days 13-14)

### Day 13: Error Handling & Edge Cases

**Tasks:**
1. **Token Validation Edge Cases**
   - Expired tokens
   - Invalid tokens
   - Already completed assessments
   - Deleted assessments

2. **Network Error Handling**
   - Retry failed API calls (3 attempts)
   - Show offline indicator
   - Queue failed auto-saves

3. **Form Validation**
   - Client-side validation messages
   - Server-side error display
   - Prevent duplicate submissions

4. **Loading States**
   - Skeleton loaders for tables
   - Spinner for API calls
   - Progress indicators

5. **Empty States**
   - No assessments created yet
   - No invitations sent
   - No results available

6. **Confirmation Dialogs**
   - Delete assessment
   - Exit assessment
   - Submit assessment

**Deliverables:**
- ✅ Error boundary components
- ✅ Toast notification system
- ✅ Retry logic for API calls
- ✅ All loading states implemented
- ✅ All empty states designed
- ✅ Confirmation dialogs for destructive actions

---

### Day 14: Testing & Bug Fixes

**Testing Checklist:**

**1. Recruiter Flow Testing**
- [ ] Create assessment with 5 problems
- [ ] Edit assessment title and duration
- [ ] Delete draft assessment
- [ ] Publish assessment
- [ ] Cannot delete published assessment with invitations
- [ ] Send invitations to 3 emails
- [ ] Resend invitation
- [ ] View results (empty state)
- [ ] Export CSV

**2. Candidate Flow Testing**
- [ ] Access assessment via token
- [ ] Invalid token shows error
- [ ] Expired token shows error
- [ ] Start assessment (timer starts)
- [ ] Solve first problem
- [ ] Navigate between problems
- [ ] Auto-save works (refresh page, code persists)
- [ ] Timer warning at 5 minutes
- [ ] Submit assessment manually
- [ ] Auto-submit on timer expiry
- [ ] Cannot retake completed assessment

**3. Cross-Browser Testing**
- [ ] Chrome
- [ ] Firefox
- [ ] Safari
- [ ] Edge

**4. Responsive Testing**
- [ ] Desktop (1920x1080)
- [ ] Laptop (1366x768)
- [ ] Tablet (768x1024)
- [ ] Mobile (375x667) - basic responsiveness

**5. Performance Testing**
- [ ] Dashboard loads < 1s with 50 assessments
- [ ] Problem selector loads 60 problems instantly
- [ ] Timer updates smoothly (no lag)
- [ ] Auto-save doesn't block UI

**6. Security Testing**
- [ ] Recruiter routes require authentication
- [ ] Candidate routes require valid token
- [ ] Cannot access other assessments without token
- [ ] RBAC enforced (candidate cannot access recruiter pages)

**Deliverables:**
- ✅ All test cases passed
- ✅ Known bugs documented and fixed
- ✅ Performance benchmarks met
- ✅ Cross-browser compatibility verified

---

## Technical Requirements

### State Management
- Use React Query for server state
- Use Zustand or Context API for client state
- Persist timer state to localStorage

### Styling
- Use existing Tailwind CSS setup
- Maintain consistent design with existing pages
- Reuse components from candidate side where possible

### Code Quality
- TypeScript strict mode
- ESLint and Prettier configured
- Component props documented
- Reusable components in `/components/features/assessment/`

### API Integration
- All endpoints already exist in assessment-service (port 8003)
- Use axios or fetch with interceptors
- Handle authentication (JWT in headers)
- Error handling with toast notifications

---

## Dependencies to Install

```bash
cd frontend

# Drag and drop for problem reordering
npm install @dnd-kit/core @dnd-kit/sortable

# Charts for results visualization
npm install recharts

# CSV export
npm install papaparse
npm install --save-dev @types/papaparse

# Form handling (optional, can use native)
npm install react-hook-form
npm install @hookform/resolvers zod

# Date picker
npm install react-datepicker
npm install --save-dev @types/react-datepicker

# Toast notifications (if not already installed)
npm install react-hot-toast
```

---

## File Structure

```
frontend/src/
├── api/
│   └── assessment.api.ts          ✅ Create
├── types/
│   └── assessment.types.ts        ✅ Create
├── hooks/
│   └── useAssessments.ts          ✅ Create
├── pages/
│   ├── RecruiterDashboard.tsx     ✅ Update (exists but incomplete)
│   ├── AssessmentForm.tsx         ✅ Create
│   ├── InvitationPage.tsx         ✅ Create
│   ├── ResultsPage.tsx            ✅ Create
│   ├── AssessmentLanding.tsx      ✅ Create
│   └── AssessmentIDE.tsx          ✅ Create
├── components/
│   └── features/
│       └── assessment/
│           ├── ProblemSelector.tsx           ✅ Create
│           ├── AssessmentTimer.tsx           ✅ Create
│           ├── EmailPreview.tsx              ✅ Create
│           ├── ScoreDistributionChart.tsx    ✅ Create
│           ├── ProblemPerformanceChart.tsx   ✅ Create
│           └── AssessmentNavigation.tsx      ✅ Create
└── App.tsx                         ✅ Update (add routes)
```

---

## Success Criteria

**MVP Launch Ready When:**
1. ✅ Recruiter can create assessment with 3-10 problems
2. ✅ Recruiter can send invitations to multiple emails
3. ✅ Recruiter can view results and export CSV
4. ✅ Candidate can access assessment via unique link
5. ✅ Candidate can solve problems with timer
6. ✅ Timer auto-submits on expiry
7. ✅ All test cases pass
8. ✅ No critical bugs

**Post-MVP Enhancements (Future):**
- Detailed candidate code review
- Problem-wise analytics
- Email templates customization
- Live proctoring integration
- Advanced filtering and search
- Bulk operations (archive, delete)
- Assessment templates
- Skills-based problem recommendations

---

## Risk Mitigation

**Risk 1: Timer Accuracy Issues**
- **Mitigation:** Store `startedAt` timestamp on server, calculate remaining time client-side
- **Fallback:** Server-side timeout check on submit

**Risk 2: Auto-Save Reliability**
- **Mitigation:** Debounce saves, retry on failure, queue offline
- **Fallback:** Warn user if auto-save fails, allow manual save

**Risk 3: Email Deliverability**
- **Mitigation:** Use SendGrid or similar SMTP provider
- **Fallback:** Show invitation link in UI for manual sharing

**Risk 4: Concurrent Editing**
- **Mitigation:** Lock assessment when invitations are sent
- **Fallback:** Warn recruiter if editing published assessment

**Risk 5: Browser Tab Close During Assessment**
- **Mitigation:** `beforeunload` event warning
- **Fallback:** Resume from last saved state

---

## Timeline Summary

| Phase | Duration | Deliverable |
|-------|----------|-------------|
| Phase 1: Foundation | 3 days | API client, types, React Query hooks |
| Phase 2: Recruiter Dashboard | 3 days | Dashboard, assessment form, problem selector |
| Phase 3: Invitation & Results | 3 days | Invitation page, results dashboard, CSV export |
| Phase 4: Candidate Flow | 3 days | Landing page, timer, assessment IDE |
| Phase 5: Polish & Testing | 2 days | Error handling, testing, bug fixes |
| **Total** | **14 days (2 weeks)** | **MVP Ready** |

---

## Next Immediate Steps (Start Today)

1. **Install Dependencies** (30 min)
   ```bash
   cd frontend
   npm install @dnd-kit/core @dnd-kit/sortable recharts papaparse react-hook-form
   ```

2. **Create API Client** (2 hours)
   - Create `frontend/src/api/assessment.api.ts`
   - Define all API methods
   - Test with existing backend endpoints

3. **Create TypeScript Types** (1 hour)
   - Create `frontend/src/types/assessment.types.ts`
   - Define interfaces for Assessment, Invitation, Results

4. **Create React Query Hooks** (2 hours)
   - Create `frontend/src/hooks/useAssessments.ts`
   - Implement all CRUD hooks
   - Test data fetching

**End of Day 1 Goal:** API integration complete, ready to build UI

---

## Questions to Resolve

1. **Email Service Configuration:**
   - Is NodeMailer SMTP configured in assessment-service?
   - What email provider credentials are available?

2. **Timer Persistence:**
   - Should we use localStorage or backend to track timer state?
   - Recommendation: Backend (`startedAt` timestamp already stored)

3. **Results Export Format:**
   - CSV only, or also PDF/Excel?
   - Recommendation: CSV for MVP, others post-MVP

4. **Auto-Save Frequency:**
   - How often should we auto-save code?
   - Recommendation: Debounce by 2 seconds

5. **RBAC Implementation:**
   - Are role checks already in place on frontend?
   - Recommendation: Check user role from auth context, protect routes

---

**Document End** | Last Updated: January 3, 2026 | Version 1.0

# FRD-01: Frontend Architecture

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the frontend architecture for CodeSphere, including the web client technology stack, component architecture, state management, and performance requirements.

## 2. Technology Stack

### 2.1 Core Framework
- **Framework:** React 18+ with TypeScript
- **Build Tool:** Vite (for fast development and optimized production builds)
- **Package Manager:** pnpm (for efficient dependency management)
- **Node Version:** 18+ LTS

### 2.2 UI & Styling
- **Component Library:** Radix UI (headless, accessible components)
- **Styling:** Tailwind CSS 3+ with CSS Modules for component-specific styles
- **Icons:** Lucide React
- **Animations:** Framer Motion (for complex animations), CSS transitions for simple cases

### 2.3 State Management
- **Global State:** Zustand (lightweight, performant)
- **Server State:** TanStack Query (React Query v5) for data fetching, caching, synchronization
- **Form State:** React Hook Form with Zod validation
- **WebSocket State:** Custom hooks with Zustand integration

### 2.4 Code Editor Integration
- **Editor:** Monaco Editor (powers VS Code)
- **Alternative:** CodeMirror 6 for lighter-weight scenarios
- **File System:** In-memory virtual file system with IndexedDB persistence
- **Syntax Highlighting:** Built into Monaco/CodeMirror
- **LSP Support:** Monaco Language Client for IntelliSense

### 2.5 Routing & Navigation
- **Router:** React Router v6 with data loading patterns
- **Code Splitting:** Lazy loading for routes
- **Protected Routes:** Custom authentication wrapper components

## 3. Application Architecture

### 3.1 Directory Structure

```
src/
├── app/                    # Application entry point
│   ├── App.tsx
│   ├── routes.tsx
│   └── providers.tsx
├── features/               # Feature-based modules
│   ├── auth/
│   │   ├── components/
│   │   ├── hooks/
│   │   ├── services/
│   │   └── store/
│   ├── code-editor/
│   ├── problems/
│   ├── assessments/
│   ├── dashboard/
│   └── system-design/
├── shared/                 # Shared utilities
│   ├── components/        # Reusable UI components
│   ├── hooks/            # Custom React hooks
│   ├── utils/            # Helper functions
│   ├── types/            # TypeScript types
│   └── constants/
├── services/              # API services
│   ├── api/              # REST API clients
│   ├── websocket/        # WebSocket clients
│   └── storage/          # LocalStorage/IndexedDB
└── assets/               # Static assets
```

### 3.2 Component Architecture

**Atomic Design Principles:**
- **Atoms:** Button, Input, Label, Icon
- **Molecules:** InputField (Label + Input + Error), CodeBlock
- **Organisms:** Navbar, ProblemCard, CodeEditor, TestResultPanel
- **Templates:** DashboardLayout, EditorLayout, AssessmentLayout
- **Pages:** Dashboard, ProblemSolver, AssessmentCreator

**Component Naming Convention:**
- PascalCase for components: `CodeEditor`, `ProblemList`
- kebab-case for file names: `code-editor.tsx`, `problem-list.tsx`
- Suffix with `Container` for connected components: `ProblemListContainer`

### 3.3 Key Feature Modules

#### 3.3.1 Code Editor Module
**Responsibilities:**
- Monaco editor integration with multi-file support
- File tree navigation (left sidebar)
- Terminal emulator (bottom panel)
- Split view for multiple files
- Real-time code execution via WebSocket

**Components:**
- `CodeEditorContainer` - Main editor wrapper
- `FileTree` - File/folder navigation
- `EditorTabs` - Open file tabs
- `MonacoEditor` - Monaco wrapper
- `Terminal` - Terminal emulator (xterm.js)
- `OutputPanel` - Code execution results

**State Management:**
- Editor state: open files, active file, cursor position
- File system state: virtual file tree structure
- Execution state: running status, output buffer

#### 3.3.2 Problem Solver Module
**Responsibilities:**
- Problem description rendering (Markdown)
- Code editor integration
- Test case runner
- Submission history
- AI tutor chat interface

**Components:**
- `ProblemLayout` - Split layout (description | editor | results)
- `ProblemDescription` - Markdown renderer with syntax highlighting
- `TestCasePanel` - Test inputs/outputs, custom test runner
- `AITutorChat` - Chat interface with Socratic AI
- `SubmissionHistory` - Past attempts with playback

#### 3.3.3 System Design Whiteboard Module
**Responsibilities:**
- Drag-and-drop diagram builder
- Real-time collaboration (WebSocket sync)
- Component library (load balancer, database, cache, etc.)
- Connection lines with labels
- Simulation mode visualization

**Technology:**
- **Canvas Library:** React Flow or Excalidraw (for whiteboard feel)
- **Collaboration:** WebSocket with operational transformation (OT) or CRDT
- **Export:** SVG/PNG export functionality

**Components:**
- `WhiteboardCanvas` - Main canvas area
- `ComponentPalette` - Draggable system components
- `ConnectionTool` - Draw connections between components
- `SimulationPanel` - Control simulation (traffic load, latency)
- `CollaboratorCursors` - Real-time cursor tracking

#### 3.3.4 Dashboard Module
**Responsibilities:**
- User progress tracking
- Recommended problems (AI-driven)
- Skill heatmap visualization
- Recent activity feed
- Streak tracking

**Components:**
- `DashboardOverview` - Stats cards (problems solved, streak, rank)
- `SkillHeatmap` - D3.js heatmap (topics vs. difficulty)
- `RecommendedProblems` - AI-curated problem list
- `ActivityFeed` - Recent submissions and achievements
- `ProgressChart` - Line/bar charts for progress over time

**Data Visualization:**
- **Library:** Recharts (React-friendly) or D3.js (for custom visualizations)

## 4. Performance Requirements

### 4.1 Initial Load
- **First Contentful Paint (FCP):** < 1.5s
- **Time to Interactive (TTI):** < 3s
- **Bundle Size:** Main bundle < 300KB gzipped

**Optimization Strategies:**
- Route-based code splitting
- Lazy load Monaco editor (only when entering code editor)
- Image optimization (WebP, lazy loading)
- Tree-shaking unused code

### 4.2 Runtime Performance
- **Editor Typing Latency:** < 50ms (no noticeable lag)
- **Code Execution Feedback:** First output < 500ms
- **WebSocket Reconnection:** Automatic with exponential backoff
- **Frame Rate:** 60 FPS for animations

### 4.3 Offline Capability
- **PWA Support:** Service worker for offline access to solved problems
- **Local Storage:** Cache problem descriptions and code in IndexedDB
- **Sync:** Auto-sync when connection restored

## 5. Cross-Cutting Concerns

### 5.1 Accessibility (a11y)
- WCAG 2.1 Level AA compliance
- Keyboard navigation for all interactive elements
- Screen reader support with ARIA labels
- Focus management (trap focus in modals)
- Color contrast ratio: minimum 4.5:1

### 5.2 Internationalization (i18n)
- **Library:** i18next with react-i18next
- **Initial Languages:** English (en-US)
- **Future:** Spanish, Hindi, Mandarin
- **Format:** JSON locale files per language

### 5.3 Error Handling
- **Error Boundaries:** Catch React component errors
- **Toast Notifications:** Non-blocking error messages (Sonner or React Hot Toast)
- **Sentry Integration:** Error tracking and monitoring
- **Fallback UI:** Graceful degradation for critical errors

### 5.4 Analytics
- **Events to Track:**
  - Problem attempts (start, submit, success/fail)
  - Code execution frequency
  - AI tutor interactions
  - Feature usage (system design, terminal, etc.)
- **Tools:** Mixpanel or Amplitude for product analytics
- **Privacy:** GDPR-compliant, opt-in for non-essential tracking

## 6. Development Workflow

### 6.1 Code Quality
- **Linter:** ESLint with TypeScript rules
- **Formatter:** Prettier
- **Pre-commit Hooks:** Husky + lint-staged (format and lint staged files)
- **Type Checking:** TypeScript strict mode

### 6.2 Testing
- **Unit Tests:** Vitest (faster than Jest for Vite projects)
- **Component Tests:** React Testing Library
- **E2E Tests:** Playwright
- **Coverage Goal:** >80% for critical paths

### 6.3 CI/CD
- **Build:** GitHub Actions (run tests, build, deploy preview)
- **Preview Deployments:** Vercel or Netlify (per PR)
- **Production Deployment:** Automated on merge to main

## 7. Browser Support

- **Modern Browsers:** Chrome 90+, Firefox 88+, Safari 14+, Edge 90+
- **Mobile:** iOS Safari 14+, Chrome Android 90+
- **Note:** No IE11 support (use modern ES features)

## 8. Dependencies (Key Packages)

```json
{
  "dependencies": {
    "react": "^18.2.0",
    "react-dom": "^18.2.0",
    "react-router-dom": "^6.20.0",
    "@tanstack/react-query": "^5.0.0",
    "zustand": "^4.4.0",
    "react-hook-form": "^7.48.0",
    "zod": "^3.22.0",
    "@monaco-editor/react": "^4.6.0",
    "xterm": "^5.3.0",
    "xterm-addon-fit": "^0.8.0",
    "react-flow": "^11.10.0",
    "recharts": "^2.10.0",
    "framer-motion": "^10.16.0",
    "@radix-ui/react-dropdown-menu": "^2.0.0",
    "lucide-react": "^0.300.0",
    "tailwindcss": "^3.3.0",
    "i18next": "^23.7.0",
    "react-i18next": "^13.5.0"
  },
  "devDependencies": {
    "typescript": "^5.3.0",
    "vite": "^5.0.0",
    "@vitejs/plugin-react": "^4.2.0",
    "vitest": "^1.0.0",
    "@testing-library/react": "^14.1.0",
    "playwright": "^1.40.0",
    "eslint": "^8.55.0",
    "prettier": "^3.1.0"
  }
}
```

## 9. Security Considerations

- **XSS Prevention:** Sanitize user input, use DOMPurify for rendering untrusted HTML
- **CSRF Protection:** CSRF tokens for state-changing requests
- **Secure Storage:** Never store sensitive tokens in localStorage (use httpOnly cookies)
- **Content Security Policy (CSP):** Restrict script sources
- **Subresource Integrity (SRI):** Verify CDN resources

## 10. Success Metrics

- **Performance Score:** Lighthouse score >90
- **Bundle Size:** Total JS < 1MB uncompressed
- **Error Rate:** <0.1% frontend errors
- **Load Time:** 95th percentile < 5s
- **Accessibility Score:** Lighthouse a11y score >95

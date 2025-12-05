# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

**CodeSphere** (formerly SkillForge) is a unified technical skill platform that combines algorithmic challenges with real-world engineering practice. The platform serves two ecosystems:
1. **Developer Learning Zone**: An AI-powered mentorship platform for full-stack application development practice
2. **Enterprise Hiring Hub**: A hiring intelligence platform that evaluates problem-solving process, not just test case results

**Tagline:** "Where Code Meets Reality"

This repository currently contains product documentation and technical specifications for the platform.

## Core Architecture Concepts

### Universal Code Execution Engine (UCE)
The backend service responsible for secure code compilation, execution, and testing:
- **Multi-language support**: Python 3.9+, JavaScript (Node.js 18+), Java 17, C++, SQL (PostgreSQL), React (WebContainer)
- **Isolation**: Dockerized containers or Firecracker MicroVMs with resource limits (50% CPU, 512MB memory, 5s execution time)
- **Real-time execution**: WebSocket-based streaming from Client IDE → API Gateway → Code Runner Service
- **Virtual file system**: Supports multi-file projects via JSON file tree structure mounted as volumes in Docker containers
- **API endpoint**: `POST /api/v1/execute` (see FRD for complete specification)

### Candidate Learning Zone
The learning platform differentiators:
- **Real-World Lab**: Multi-file editor with integrated terminal and localhost simulation (e.g., "Fix the bug in Parser.py causing 500 errors")
- **AI Socratic Tutor**: Context-aware AI that guides users with questions instead of providing direct answers
- **Code Playback**: Session replay feature at 10x speed for self-review and social sharing
- **Adaptive dashboard**: AI-driven problem recommendations based on user weaknesses

### Enterprise Hiring Hub
The assessment platform features:
- **Glass Box Analytics**: Tracks code churn, paste detection, execution patterns, and generates AI summaries of candidate problem-solving approach
- **System Design Whiteboard**: Real-time collaborative canvas with simulation mode to visualize bottlenecks (uses WebSocket synchronization)
- **Anti-Cheating (Honor Guard)**: Browser fingerprinting, copy-paste style analysis, tab focus monitoring

## Key Differentiators

| Aspect | Traditional Platforms | SkillForge |
|--------|----------------------|------------|
| Problem Type | Abstract algorithms | Real-world debugging scenarios |
| Assessment | Pass/Fail test cases | Process analytics (keystrokes, pauses, thought patterns) |
| Learning | Static solution forums | AI Socratic tutor with contextual hints |
| Environment | Simple text editor | Full cloud IDE with terminal and multi-file support |
| System Design | Multiple choice | Interactive drag-and-drop diagrams with load simulation |

## Documentation Structure

- **Product_Strategy.md**: Executive summary, user personas, USPs, high-level roadmap (MVP → AI Layer → Ecosystem)
- **FRD - Technical Architecture.md**: Universal Code Execution Engine specifications, security requirements, API definitions
- **PRD - Candidate Side.md**: Learning zone features, user flows, success metrics
- **PRD - Enterprise side.md**: Hiring hub features, anti-cheating mechanisms, recruiter workflows

## Development Phases

### Phase 1 (MVP - Months 1-3)
- Universal Code Sandbox with multi-language support
- 50 algorithmic problems + 10 real-world debugging tasks
- Basic assessment link generation and pass/fail reporting

### Phase 2 (AI Layer - Months 4-6)
- AI Tutor hint system implementation
- Cheating detection (tab-switch tracking, copy-paste analysis)
- System Design Board drag-and-drop tool

### Phase 3 (Ecosystem - Months 7-12)
- Marketplace for user-created courses/challenges
- Live interview "Pair Programming" mode with video/audio
- IDE plugin for taking tests inside local VS Code

## Working with This Codebase

This repository contains planning and specification documents only. When implementing features:

1. **Refer to the appropriate PRD/FRD** for detailed requirements before starting implementation
2. **Security is critical**: All code execution must be sandboxed with proper resource limits and network isolation
3. **Real-time streaming** is a core requirement: Use WebSocket connections for code execution output
4. **Multi-file support** distinguishes this platform: Ensure file tree structures are properly handled
5. **AI integration points**: Socratic tutor (candidate side) and analytics summaries (enterprise side) require LLM integration
6. **WebSocket synchronization** needed for: System Design Whiteboard, Live Interview mode, and real-time code execution

## Key Performance Requirements

- **Latency**: Code execution first output < 500ms
- **Scalability**: Handle 10,000 concurrent code executions (requires Kubernetes auto-scaling)
- **Reliability**: 99.9% uptime (stateless runners)
- **Security**: Zero cross-user session access, proper container isolation

# FRD-06: AI/ML Services Architecture

**Version:** 1.0
**Last Updated:** December 2025
**Status:** Draft

## 1. Overview

This document defines the AI/ML architecture for CodeSphere, including the Socratic AI Tutor, Glass Box analytics, problem recommendations, cheating detection, and code quality assessment.

## 2. AI/ML Technology Stack

### 2.1 Large Language Models (LLMs)

**Primary LLM Provider:** OpenAI or Anthropic

**Models:**
- **Production:** GPT-4 Turbo or Claude 3 Opus (high reasoning, expensive)
- **Development:** GPT-3.5 Turbo or Claude 3 Sonnet (faster, cheaper)
- **Code-Specific:** OpenAI Codex or CodeLlama (for code generation, not tutoring)

**Cost Optimization:**
- Use GPT-3.5 for simple queries (hints, suggestions)
- Use GPT-4 for complex analysis (Glass Box reports, deep debugging)
- Cache frequent prompts to reduce API calls
- Implement prompt throttling (max 5 tutor requests per problem)

### 2.2 Vector Databases
**Pinecone** or **Weaviate** for semantic code search and similarity detection

**Use Cases:**
- Code plagiarism detection (store code embeddings)
- Problem recommendations (find similar problems)
- Solution search (find relevant solutions from past submissions)

### 2.3 Code Analysis Tools
- **Tree-sitter:** Multi-language AST (Abstract Syntax Tree) parsing
- **SonarQube:** Static code analysis for quality metrics
- **Pylint, ESLint, golangci-lint:** Language-specific linters

### 2.4 ML Frameworks
- **scikit-learn:** Classical ML (classification, clustering)
- **TensorFlow/PyTorch:** Deep learning (if needed for custom models)
- **Hugging Face Transformers:** Pre-trained models for NLP tasks

## 3. Socratic AI Tutor

### 3.1 Design Philosophy

**Goals:**
1. **Never give direct answers:** Guide, don't solve
2. **Ask probing questions:** Encourage critical thinking
3. **Adjust tone:** Supportive or strict based on user preference
4. **Context-aware:** Understand the problem, user's code, and conversation history

**Anti-Goals:**
- Don't write complete code solutions
- Don't solve the problem for the user
- Don't be condescending or unhelpful

### 3.2 System Architecture

```
User Question
     │
     ▼
┌─────────────────┐
│  Context Loader │ (Load problem, user code, past submissions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  Prompt Builder │ (Construct LLM prompt with system instructions)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│   LLM (GPT-4)   │ (Generate Socratic response)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Response Filter │ (Detect code snippets, ensure no direct answers)
└────────┬────────┘
         │
         ▼
    Return to User
```

### 3.3 Prompt Engineering

**System Prompt:**
```python
SOCRATIC_TUTOR_SYSTEM_PROMPT = """
You are a Socratic coding tutor for CodeSphere. Your goal is to guide students
to discover solutions themselves, NOT to solve problems for them.

STRICT RULES:
1. NEVER write complete code solutions (no more than 2-3 lines of example code)
2. Ask guiding questions that lead the student to the answer
3. Point out errors without fixing them ("What happens when i reaches len(arr)?")
4. Encourage experimentation ("Try printing the variable at each step")
5. Provide hints that reduce the search space without giving the answer
6. If the student explicitly asks for the answer, politely refuse and offer a hint

TONE: {tone}  # 'encouraging', 'neutral', or 'strict'

RESPONSE FORMAT:
- Keep responses under 150 words
- Use simple language (avoid jargon unless necessary)
- End with a question or suggestion for next steps
"""

def build_tutor_prompt(problem, user_code, user_question, conversation_history, tone='encouraging'):
    context = f"""
PROBLEM:
{problem.title}
{problem.description}

USER'S CURRENT CODE:
```{problem.language}
{user_code}
```

CONVERSATION HISTORY:
{format_conversation(conversation_history)}

USER'S QUESTION:
{user_question}

Provide a Socratic response that guides the user without solving the problem.
"""
    return {
        'system': SOCRATIC_TUTOR_SYSTEM_PROMPT.format(tone=tone),
        'user': context
    }
```

**Example Prompt:**
```
PROBLEM:
Two Sum
Given an array of integers nums and an integer target, return indices of the two
numbers such that they add up to target.

USER'S CURRENT CODE:
```python
def two_sum(nums, target):
    for i in range(len(nums)):
        for j in range(len(nums)):
            if nums[i] + nums[j] == target:
                return [i, j]
```

USER'S QUESTION:
"My code is timing out on large inputs. How do I fix it?"

ASSISTANT RESPONSE:
"Your code is checking every possible pair, which takes O(n²) time. Think about
this: If you're looking at nums[i], you need to find a number that equals
target - nums[i], right? Is there a data structure that can check if a number
exists in constant time? Try printing target - nums[i] as you iterate to see
what you're looking for."
```

### 3.4 Response Validation

**Filter:** Detect if response contains code snippets > 3 lines

```python
import re

def validate_tutor_response(response: str) -> tuple[bool, str]:
    # Detect code blocks
    code_blocks = re.findall(r'```[\s\S]*?```', response)

    for block in code_blocks:
        lines = block.strip().split('\n')
        if len(lines) > 5:  # More than 5 lines of code = likely a full solution
            return False, "Response contains too much code. Regenerate with more guidance, less code."

    # Detect common "giving away" phrases
    giveaway_phrases = [
        'here is the solution',
        'the answer is',
        'here\'s the code',
        'copy this'
    ]

    if any(phrase in response.lower() for phrase in giveaway_phrases):
        return False, "Response is too direct. Be more Socratic."

    return True, ""
```

### 3.5 Cost Management

**Strategies:**
- **Limit:** Max 5 tutor requests per problem per user
- **Cache:** Cache responses for common questions (e.g., "What is two pointers?")
- **Tiered Access:**
  - Free: 10 tutor requests/day
  - Pro: Unlimited tutor requests
  - Enterprise: Unlimited + priority queue

**Implementation:**
```python
async def get_tutor_response(user_id: str, problem_id: str, question: str):
    # Check rate limit
    key = f"tutor:limit:{user_id}:{problem_id}"
    count = await redis.get(key) or 0

    if int(count) >= 5 and user.tier == 'free':
        return {"error": "Daily limit reached. Upgrade to Pro for unlimited hints."}

    # Increment counter
    await redis.incr(key)
    await redis.expire(key, 86400)  # 24 hours

    # Check cache
    cache_key = f"tutor:cache:{problem_id}:{hash(question)}"
    cached = await redis.get(cache_key)
    if cached:
        return json.loads(cached)

    # Call LLM
    response = await call_llm(...)

    # Cache for 1 hour
    await redis.setex(cache_key, 3600, json.dumps(response))

    return response
```

## 4. Glass Box Analytics

### 4.1 Metrics to Track

**Keystroke Metrics:**
- **Code Churn:** Number of edits per line of code (indicates confusion)
- **Typing Speed:** Characters per minute (detect pasting vs. typing)
- **Pause Patterns:** Long pauses (>10s) indicate thinking or getting help

**Behavioral Metrics:**
- **Test Execution Frequency:** How often did they run tests? (good: frequent; bad: once at the end)
- **Debugging Approach:** Did they use print statements, breakpoints, or guess randomly?
- **Tab Switches:** How many times did they leave the assessment tab?
- **Copy-Paste Events:** Large code blocks pasted suddenly

**Code Quality Metrics:**
- **Time Complexity:** Analyze Big-O of solution
- **Code Cleanliness:** Variable names, comments, modularity
- **Test Coverage:** Did they write additional test cases?

### 4.2 Data Processing Pipeline

```
Keystroke Data (Raw)
     │
     ▼
┌─────────────────┐
│  Data Cleaning  │ (Remove duplicates, filter noise)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Feature Extract │ (Calculate code churn, typing speed, etc.)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│ Anomaly Detect  │ (Flag suspicious patterns)
└────────┬────────┘
         │
         ▼
┌─────────────────┐
│  LLM Analysis   │ (Generate natural language summary)
└────────┬────────┘
         │
         ▼
   Glass Box Report
```

### 4.3 Feature Extraction

```python
from dataclasses import dataclass
from typing import List

@dataclass
class KeystrokeEvent:
    timestamp: float
    file: str
    line: int
    char: int
    action: str  # 'insert', 'delete', 'paste'
    content: str

def calculate_code_churn(events: List[KeystrokeEvent], final_code: str) -> float:
    """
    Code churn = (total characters typed) / (final code length)
    Higher churn = more confusion/rewrites
    """
    total_chars = sum(len(e.content) for e in events if e.action == 'insert')
    final_length = len(final_code)

    return total_chars / final_length if final_length > 0 else 0

def calculate_typing_speed(events: List[KeystrokeEvent]) -> float:
    """
    Characters per minute (ignore paste events)
    """
    typed_events = [e for e in events if e.action == 'insert' and len(e.content) == 1]

    if len(typed_events) < 2:
        return 0

    time_span = typed_events[-1].timestamp - typed_events[0].timestamp
    chars_typed = len(typed_events)

    return (chars_typed / time_span) * 60 if time_span > 0 else 0

def detect_paste_events(events: List[KeystrokeEvent]) -> List[dict]:
    """
    Detect paste events (>20 characters inserted at once)
    """
    return [
        {
            'timestamp': e.timestamp,
            'length': len(e.content),
            'content_preview': e.content[:50]
        }
        for e in events if e.action == 'paste' and len(e.content) > 20
    ]

def calculate_debug_efficiency(test_runs: int, successful_submit: bool) -> float:
    """
    Efficiency = 1 / test_runs (fewer tests = more confident/lucky)
    """
    if not successful_submit:
        return 0.0

    return 1 / test_runs if test_runs > 0 else 1.0
```

### 4.4 Anomaly Detection

```python
def detect_anomalies(session_data: AssessmentSession) -> List[str]:
    red_flags = []

    # Check typing speed (too fast = likely pasted)
    if session_data.typing_speed > 500:  # >500 CPM = inhuman
        red_flags.append(f"Unusually high typing speed: {session_data.typing_speed} CPM")

    # Check code churn (too low = pasted solution)
    if session_data.code_churn < 1.2 and session_data.solution_length > 50:
        red_flags.append(f"Low code churn ({session_data.code_churn}): possible paste")

    # Check paste events
    if len(session_data.paste_events) > 3:
        red_flags.append(f"{len(session_data.paste_events)} paste events detected")

    # Check tab switches
    if session_data.tab_switches > 10:
        red_flags.append(f"Excessive tab switching: {session_data.tab_switches} times")

    # Check style consistency
    if has_style_inconsistency(session_data.code_history):
        red_flags.append("Code style changed significantly during session")

    return red_flags

def has_style_inconsistency(code_history: List[str]) -> bool:
    """
    Check if coding style (indentation, naming) changed drastically
    """
    if len(code_history) < 2:
        return False

    first_half = '\n'.join(code_history[:len(code_history)//2])
    second_half = '\n'.join(code_history[len(code_history)//2:])

    # Compare indentation style
    first_indent = get_indentation_style(first_half)
    second_indent = get_indentation_style(second_half)

    return first_indent != second_indent

def get_indentation_style(code: str) -> str:
    """Returns 'spaces' or 'tabs'"""
    space_lines = len([line for line in code.split('\n') if line.startswith('    ')])
    tab_lines = len([line for line in code.split('\n') if line.startswith('\t')])

    return 'spaces' if space_lines > tab_lines else 'tabs'
```

### 4.5 LLM-Generated Summary

**Prompt:**
```python
GLASS_BOX_SUMMARY_PROMPT = """
Analyze this candidate's coding session and generate a concise assessment.

PROBLEM: {problem_title}

METRICS:
- Code Churn: {code_churn} (1.0 = clean, >2.0 = many rewrites)
- Typing Speed: {typing_speed} CPM
- Test Runs: {test_runs}
- Time Taken: {time_taken} minutes
- Tab Switches: {tab_switches}
- Paste Events: {paste_events}

RED FLAGS:
{red_flags}

CODE QUALITY:
- Time Complexity: {time_complexity}
- Space Complexity: {space_complexity}
- Code Cleanliness: {code_cleanliness}/10

Generate a 2-3 sentence summary of the candidate's performance. Include:
1. Problem-solving approach (methodical, trial-and-error, etc.)
2. Strengths (debugging skills, code quality, etc.)
3. Concerns (red flags, inefficiencies)

RECOMMENDATION: Strong Hire | Hire | Maybe | No Hire
"""

async def generate_glass_box_report(session: AssessmentSession) -> GlassBoxReport:
    prompt = GLASS_BOX_SUMMARY_PROMPT.format(
        problem_title=session.problem.title,
        code_churn=round(session.metrics.code_churn, 2),
        typing_speed=round(session.metrics.typing_speed, 2),
        test_runs=session.metrics.test_runs,
        time_taken=round(session.time_taken / 60, 1),
        tab_switches=session.metrics.tab_switches,
        paste_events=len(session.metrics.paste_events),
        red_flags='\n'.join(session.red_flags) or 'None',
        time_complexity=analyze_time_complexity(session.final_code),
        space_complexity=analyze_space_complexity(session.final_code),
        code_cleanliness=assess_code_quality(session.final_code)
    )

    response = await call_llm(prompt, model='gpt-4')

    return GlassBoxReport(
        summary=response['summary'],
        recommendation=response['recommendation'],
        metrics=session.metrics,
        red_flags=session.red_flags
    )
```

## 5. Problem Recommendations

### 5.1 Recommendation Algorithm

**Approach:** Collaborative filtering + Content-based filtering

**Inputs:**
- User's solved problems
- Weak topics (identified by failed attempts)
- Difficulty preference (gradually increase)
- Similar users' problem history

**Process:**
1. **Identify Weak Topics:** Count failed attempts by topic
2. **Find Similar Problems:** Use cosine similarity of problem embeddings
3. **Filter by Difficulty:** Start with easy, progress to medium/hard
4. **Avoid Repetition:** Don't recommend similar problems consecutively

**Implementation:**
```python
from sklearn.metrics.pairwise import cosine_similarity
import numpy as np

async def recommend_problems(user_id: str, limit: int = 5) -> List[Problem]:
    # Get user's history
    solved = await get_solved_problems(user_id)
    attempted = await get_attempted_problems(user_id)

    # Identify weak topics
    weak_topics = identify_weak_topics(attempted)

    # Get candidate problems (not yet solved)
    candidates = await get_problems_by_topics(weak_topics)
    candidates = [p for p in candidates if p.id not in solved]

    # Load problem embeddings
    problem_embeddings = await load_problem_embeddings(candidates)

    # Score candidates
    scores = []
    for candidate in candidates:
        score = calculate_recommendation_score(
            candidate,
            weak_topics,
            solved,
            problem_embeddings
        )
        scores.append((candidate, score))

    # Sort by score (descending) and return top N
    scores.sort(key=lambda x: x[1], reverse=True)
    return [p for p, _ in scores[:limit]]

def calculate_recommendation_score(problem, weak_topics, solved, embeddings):
    score = 0

    # Topic relevance (40%)
    topic_overlap = len(set(problem.tags) & set(weak_topics))
    score += topic_overlap * 0.4

    # Difficulty progression (30%)
    avg_solved_difficulty = get_avg_difficulty(solved)
    if problem.difficulty == get_next_difficulty(avg_solved_difficulty):
        score += 0.3

    # Freshness (20%): Prioritize newer problems
    days_old = (datetime.now() - problem.created_at).days
    score += (1 - min(days_old / 365, 1)) * 0.2

    # Popularity (10%): Recommend popular problems
    score += (problem.acceptance_rate / 100) * 0.1

    return score
```

### 5.2 Cold Start Problem

**For New Users:**
- Recommend top 10 most popular problems (sorted by acceptance rate)
- Ask onboarding questions: "What's your experience level?", "What topics interest you?"
- Use responses to seed recommendations

## 6. Code Plagiarism Detection

### 6.1 Algorithm

**Approach:** AST-based similarity + Code embeddings

**Steps:**
1. **Normalize Code:** Remove comments, whitespace, rename variables to generic names
2. **Parse to AST:** Convert to Abstract Syntax Tree
3. **Compute Similarity:** Compare AST structures using tree edit distance
4. **Embedding Similarity:** Use CodeBERT embeddings for semantic similarity

**Implementation:**
```python
import ast
import hashlib
from transformers import AutoTokenizer, AutoModel
import torch

# Load CodeBERT
tokenizer = AutoTokenizer.from_pretrained("microsoft/codebert-base")
model = AutoModel.from_pretrained("microsoft/codebert-base")

def normalize_code(code: str) -> str:
    """
    Remove comments, extra whitespace, and rename variables
    """
    tree = ast.parse(code)

    # Remove docstrings
    for node in ast.walk(tree):
        if isinstance(node, ast.FunctionDef):
            if ast.get_docstring(node):
                node.body = node.body[1:]

    # Convert back to code
    return ast.unparse(tree)

def ast_similarity(code1: str, code2: str) -> float:
    """
    Compare AST structures (simplified: use tree dump similarity)
    """
    try:
        tree1 = ast.dump(ast.parse(normalize_code(code1)))
        tree2 = ast.dump(ast.parse(normalize_code(code2)))

        # Compute string similarity (rough approximation)
        from difflib import SequenceMatcher
        return SequenceMatcher(None, tree1, tree2).ratio()
    except:
        return 0.0

def embedding_similarity(code1: str, code2: str) -> float:
    """
    Use CodeBERT embeddings for semantic similarity
    """
    inputs1 = tokenizer(code1, return_tensors="pt", truncation=True, max_length=512)
    inputs2 = tokenizer(code2, return_tensors="pt", truncation=True, max_length=512)

    with torch.no_grad():
        emb1 = model(**inputs1).last_hidden_state.mean(dim=1)
        emb2 = model(**inputs2).last_hidden_state.mean(dim=1)

    # Cosine similarity
    similarity = torch.nn.functional.cosine_similarity(emb1, emb2)
    return similarity.item()

async def detect_plagiarism(submission_id: str) -> dict:
    submission = await get_submission(submission_id)
    similar_submissions = await get_recent_submissions(submission.problem_id, limit=100)

    plagiarism_reports = []

    for other in similar_submissions:
        if other.id == submission.id:
            continue

        ast_sim = ast_similarity(submission.code, other.code)
        emb_sim = embedding_similarity(submission.code, other.code)

        # Weighted average
        total_sim = 0.6 * ast_sim + 0.4 * emb_sim

        if total_sim > 0.85:  # 85% similar = likely plagiarism
            plagiarism_reports.append({
                'other_submission_id': other.id,
                'similarity': total_sim,
                'user_id': other.user_id
            })

    return {
        'is_plagiarized': len(plagiarism_reports) > 0,
        'matches': plagiarism_reports
    }
```

### 6.2 Vector Database for Fast Search

**Use Pinecone to store code embeddings:**

```python
import pinecone

pinecone.init(api_key="...", environment="us-west1-gcp")
index = pinecone.Index("code-embeddings")

async def store_submission_embedding(submission: Submission):
    # Generate embedding
    embedding = get_code_embedding(submission.code)

    # Store in Pinecone
    index.upsert([(
        submission.id,
        embedding,
        {
            'user_id': submission.user_id,
            'problem_id': submission.problem_id,
            'timestamp': submission.submitted_at.isoformat()
        }
    )])

async def find_similar_submissions(submission: Submission, top_k: int = 10):
    embedding = get_code_embedding(submission.code)

    # Query Pinecone
    results = index.query(embedding, top_k=top_k, include_metadata=True)

    return [
        {
            'submission_id': match['id'],
            'similarity': match['score'],
            'metadata': match['metadata']
        }
        for match in results['matches']
    ]
```

## 7. Code Quality Assessment

### 7.1 Static Analysis

**Metrics:**
- **Cyclomatic Complexity:** Number of independent paths (< 10 = good)
- **Lines of Code:** Total lines (shorter is often better)
- **Comment Ratio:** Comments / code lines (10-20% ideal)
- **Function Length:** Lines per function (< 20 lines ideal)

**Tools:**
- **Python:** `radon`, `pylint`
- **JavaScript:** `eslint-plugin-complexity`
- **Java:** `checkstyle`

**Example (Python):**
```python
from radon.complexity import cc_visit
from radon.metrics import mi_visit

def assess_code_quality(code: str) -> dict:
    # Cyclomatic complexity
    complexity = cc_visit(code)
    avg_complexity = sum(c.complexity for c in complexity) / len(complexity) if complexity else 0

    # Maintainability index (0-100, higher is better)
    maintainability = mi_visit(code, multi=True)

    # Lines of code
    loc = len([line for line in code.split('\n') if line.strip() and not line.strip().startswith('#')])

    return {
        'complexity': avg_complexity,
        'maintainability': maintainability,
        'loc': loc,
        'grade': calculate_grade(avg_complexity, maintainability, loc)
    }

def calculate_grade(complexity, maintainability, loc):
    score = 0

    # Complexity (40%)
    if complexity < 5:
        score += 40
    elif complexity < 10:
        score += 30
    else:
        score += 10

    # Maintainability (40%)
    score += (maintainability / 100) * 40

    # LOC (20%): Penalize very long solutions
    if loc < 50:
        score += 20
    elif loc < 100:
        score += 15
    else:
        score += 5

    return round(score)
```

## 8. Model Training & Fine-Tuning

### 8.1 Future: Custom Models

**Why Fine-Tune?**
- Reduce reliance on expensive GPT-4 API
- Customize for specific use cases (coding problem tutoring)
- Reduce latency (self-hosted models)

**Approach:**
1. **Collect Data:** User-tutor conversations, Glass Box reports
2. **Fine-Tune Model:** Use Llama 2 or Mistral (open-source)
3. **Evaluate:** Compare quality vs. GPT-4
4. **Deploy:** Self-host on AWS (GPU instances) or use Hugging Face Inference API

**Dataset Format:**
```json
[
  {
    "prompt": "User asked: 'Why is my code slow?' Code: [...]",
    "completion": "Your code has O(n²) complexity. Consider using a hash map..."
  },
  {
    "prompt": "Generate Glass Box report for: [metrics]",
    "completion": "Candidate demonstrated strong debugging skills..."
  }
]
```

## 9. Monitoring & Evaluation

### 9.1 AI Service Metrics
- **Tutor Response Quality:** User feedback (thumbs up/down)
- **Glass Box Accuracy:** Correlation with interview outcomes
- **Recommendation CTR:** Click-through rate on recommended problems
- **Plagiarism Detection Precision:** False positive rate

### 9.2 Cost Tracking
- **LLM API Cost:** Track spend per request (GPT-4 is expensive)
- **Token Usage:** Monitor prompt + completion tokens
- **Optimization Goal:** Reduce cost while maintaining quality

### 9.3 A/B Testing
- **Test Variations:** Different prompts, models, parameters
- **Metrics:** User engagement, satisfaction, conversion

## 10. Success Metrics

- **Tutor Satisfaction:** >80% thumbs up on tutor responses
- **Glass Box Adoption:** >70% of enterprise clients use Glass Box reports
- **Recommendation Accuracy:** >60% of recommended problems are attempted
- **Plagiarism Detection:** <5% false positive rate
- **Cost Efficiency:** <$0.10 per tutor interaction

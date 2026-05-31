# AI Service

CodeSphere's AI surface — currently powers the Socratic Tutor. Built so the
underlying LLM can be swapped via env var without touching consumer code.

## Endpoints

- `POST /api/v1/ai/socratic` — given a problem, the user's current code, and
  their question, returns one Socratic question that nudges the user toward
  the next insight (never reveals the solution).
- `GET /health` — liveness + currently-configured provider.

## Provider model

`LLMProvider` (`src/providers/base.py`) is the abstract transport. All consumer
code speaks only this interface — `chat()` and `stream()` over a generic
`list[Message]`. To add a new provider:

1. Create `src/providers/<name>_provider.py` implementing `LLMProvider`.
2. Wire it into `get_provider()` in `src/providers/__init__.py`.
3. Set `LLM_PROVIDER=<name>` in `.env`.

No service or router code changes — the abstraction is the contract.

## Local development

### 1. Install and run Ollama

```bash
brew install ollama          # or download from ollama.com
ollama serve &               # starts on http://localhost:11434
ollama pull llama3.2:3b      # ~2GB, runs fine on a laptop
```

### 2. Install Python deps

```bash
cd backend/ai-service
python3 -m venv .venv && source .venv/bin/activate
pip install -r requirements.txt
cp .env.example .env
```

### 3. Run

```bash
uvicorn src.main:app --reload --port 8004
```

### 4. Smoke test

```bash
curl -X POST http://localhost:8004/api/v1/ai/socratic \
  -H "Content-Type: application/json" \
  -d '{
    "problem_title": "Two Sum",
    "problem_description": "Given an array of integers nums and an integer target, return indices of the two numbers such that they add up to target.",
    "user_code": "def two_sum(nums, target):\n    for i in range(len(nums)):\n        for j in range(len(nums)):\n            if nums[i] + nums[j] == target:\n                return [i, j]",
    "user_language": "python",
    "user_message": "My solution is timing out on big inputs. What should I do?"
  }'
```

Expect one focused question back — not code, not the answer.

## Migrating to Claude (future)

When you want to move off local Ollama:

1. Add `src/providers/claude_provider.py` (use `anthropic` SDK, RS256-free).
2. Register it in `get_provider()`.
3. Set in `.env`:
   ```
   LLM_PROVIDER=claude
   ANTHROPIC_API_KEY=sk-ant-...
   ANTHROPIC_MODEL=claude-sonnet-4-6
   ```
4. Restart. No other change.

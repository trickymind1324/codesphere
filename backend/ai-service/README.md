# AI Service

CodeSphere's AI surface — powers the Socratic Tutor and the Glass Box
analytics summary. Built so the underlying LLM can be swapped via env var
without touching consumer code.

## Endpoints

- `POST /api/v1/ai/socratic` — given a problem, the user's current code, and
  their question, returns one Socratic question that nudges the user toward
  the next insight (never reveals the solution).
- `POST /api/v1/ai/glass-box-summary` — turns a candidate's session events
  into a recruiter-readable narrative of their problem-solving approach.
- `GET /health` — liveness + currently-configured provider.

## Providers

Three providers ship out of the box, selected with `LLM_PROVIDER`:

| `LLM_PROVIDER` | What it talks to | Required env |
|---|---|---|
| `ollama` (default) | Local [Ollama](https://ollama.com) — free, private, no API key | `OLLAMA_HOST`, `OLLAMA_MODEL` (default `gemma3:4b`) |
| `anthropic` | Anthropic Messages API | `ANTHROPIC_API_KEY`, `ANTHROPIC_MODEL` |
| `openai` | Any OpenAI-compatible endpoint — OpenAI, **Google Gemini**, Groq, Together, Mistral, even Ollama's own `/v1` | `OPENAI_API_KEY`, `OPENAI_MODEL`, `OPENAI_BASE_URL` |

Examples (see `.env.example` for the full reference):

```bash
# Anthropic
LLM_PROVIDER=anthropic
ANTHROPIC_API_KEY=sk-ant-...
ANTHROPIC_MODEL=claude-sonnet-4-6

# OpenAI
LLM_PROVIDER=openai
OPENAI_API_KEY=sk-...
OPENAI_MODEL=gpt-4o-mini

# Google Gemini (via its OpenAI-compatible endpoint)
LLM_PROVIDER=openai
OPENAI_API_KEY=<your Gemini API key>
OPENAI_MODEL=gemini-2.0-flash
OPENAI_BASE_URL=https://generativelanguage.googleapis.com/v1beta/openai
```

### Adding another provider

`LLMProvider` (`src/providers/base.py`) is the abstract transport — `chat()`
and `stream()` over a generic `list[Message]`. Consumers speak only this
interface:

1. Create `src/providers/<name>_provider.py` implementing `LLMProvider`.
2. Wire it into `get_provider()` in `src/providers/__init__.py`.
3. Set `LLM_PROVIDER=<name>` in `.env`.

No service or router code changes — the abstraction is the contract.

## Local development

### 1. Install and run Ollama (skip if using an API key)

```bash
brew install ollama          # or download from ollama.com
ollama serve &               # starts on http://localhost:11434
ollama pull gemma3:4b        # ~3GB; llama3.2:3b is a lighter fallback
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

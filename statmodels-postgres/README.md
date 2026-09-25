## API Endpoints for the Frontend

The default local base URL is:

```text
http://localhost:8000
```

All normal API responses use this envelope:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

### Health

```text
GET /health
```

Checks whether the API is reachable.

### MCQ diagnosis

```text
POST /diagnose/mcq
```

```json
{
  "student_id": "student-1",
  "question_id": "mcq-1",
  "topic_id": "binary-search",
  "selected_option_id": "option-b",
  "correct_option_id": "option-a",
  "response_time_ms": 4200
}
```

Returns `data.diagnosis` and `data.mastery`, and logs the attempt.

### YouTube embed conversion

```text
POST /youtube/embed
```

```json
{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
```

Returns:

```json
{
  "ok": true,
  "data": {
    "embed_url": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  },
  "error": null
}
```

## What's placeholder vs. real
# Stat Models Module

BKT engine, misconception diagnosis, prerequisite root-cause tracer, forgetting-curve
scheduler. Implements the contract in `stat-models-io-contract.md` (sent to frontend
separately) exactly.

## Run it

```bash
# 1. Postgres running, DATABASE_URL pointing at it (defaults to
#    postgresql://postgres:postgres@localhost:5432/statmodels)
psql -U postgres -c "CREATE DATABASE statmodels"
psql -U postgres -d statmodels -f db/schema.sql

# 2. deps
pip install -r requirements.txt

# 3. seed data — REPLACE scripts/seed.py's TOPICS/EDGES/MISCONCEPTIONS/MCQS
#    with real curriculum data before the demo. Current contents are placeholder,
#    covering just enough of a DSA slice to reproduce the doc's example trace.
PYTHONPATH=. python3 scripts/seed.py

# 4. serve
PYTHONPATH=. uvicorn app.main:app --host 0.0.0.0 --port 8000

# 5. prove it end-to-end (no HTTP, straight to the DB — good smoke test)
PYTHONPATH=. python3 scripts/demo_trace.py
```

## API documentation

Once the server is running, open the generated API contract at:

- Swagger UI: `http://localhost:8000/docs`
- ReDoc: `http://localhost:8000/redoc`
- OpenAPI JSON: `http://localhost:8000/openapi.json`

Swagger groups the routes by feature and lets the frontend developer inspect request
schemas, try calls, and copy the endpoint contract without reading the implementation.

For step-by-step React/Next.js integration, see `FRONTEND_INTEGRATION_GUIDE.md`.
For complete PostgreSQL, backend, and frontend setup, see `PROJECT_INTEGRATION_GUIDE.md`.

## Endpoints

| Method | Path | Maps to contract section |
|---|---|---|
| POST | `/diagnose/mcq` | 1a |
| POST | `/diagnose/code` | 1b |
| POST | `/bkt/update` | 2 |
| GET | `/bkt/mastery?student_id=&topic_id=` | 2 |
| POST | `/root-cause/trace` | 3 |
| GET | `/forgetting-curve/run?student_id=` | 4 |
| GET | `/misconception-history?student_id=&misconception_id=` | 5 (the count/recency helper) |
| POST | `/onboarding/diagnostic` | 1c (new) |
| POST | `/youtube/embed` | Convert a YouTube URL to an in-site embed URL |
| GET | `/resources` | List curated DSA, DBMS, System Design, and Web Development resources |
| GET | `/study-materials` | List SQL-backed videos, documents, and external links |
| GET | `/questions` | Return a randomized difficulty-filtered MCQ batch |
| GET | `/questions/batch` | Return exact easy/intermediate/hard question counts |

All responses: `{ok, data, error}`. Errors use `TOPIC_NOT_FOUND` / `INSUFFICIENT_DATA` /
`LLM_TIMEOUT` / `STUDENT_NOT_FOUND` codes — see `app/errors.py`.

To load the complete four-domain question bank from a saved source text file:

```powershell
$env:PYTHONPATH = "."
python scripts\parse_question_bank.py data\question-bank-source.txt data\question-bank.json
python scripts\import_question_bank.py data\question-bank.json
```

**Updated:** `/diagnose/mcq` and `/diagnose/code` now run diagnosis → BKT update →
attempt log in one call and return `{"diagnosis": {...}, "mastery": {...}}`, instead of
just the diagnosis. Previously the attempts table was only ever written by hand in
`scripts/demo_trace.py`, which meant the real API never logged anything — contradicting
this file's own "frontend reads via API only" rule. `app/attempts.py` is the fix; see
the IO contract doc for the exact new response shape.

Also fixed a bug in `/misconception-history`: `occurrences_in_last_4_topic_attempts`
previously counted the last 4 attempts on the topic unconditionally, without checking
whether they actually matched the given `misconception_id`. It now filters correctly,
and the response includes a new `attempts_considered` field (how many attempts,
up to 4, existed on that topic — useful for the frontend to know when the fraction
is e.g. "3 of 2" because the student's only made 2 attempts so far).

## LLM misconception classifier

Off by default (`USE_LLM_DIAGNOSIS=false`) — code-path diagnosis runs on a rule-based
heuristic (`app/misconceptions.py::_rule_based_code_diagnosis`) so the whole pipeline is
runnable/demoable with zero API cost or network dependency. To use the real classifier:

```bash
export USE_LLM_DIAGNOSIS=true
export ANTHROPIC_API_KEY=sk-ant-...
```

If the LLM call fails/times out, it falls back to the rule-based path automatically
(`source: "code_rule_fallback_after_llm_timeout"` in the response) — never a hard failure
on the demo.

### YouTube videos inside the website

Send a regular YouTube watch, Shorts, or `youtu.be` URL to `/youtube/embed`. The
response contains `data.embed_url`, which the frontend can use as the `src` of an
iframe so the learner stays on the website:

```html
<iframe
  src="https://www.youtube-nocookie.com/embed/VIDEO_ID"
  title="Lesson video"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowfullscreen>
</iframe>
```

The `youtube-nocookie.com` host enables YouTube's privacy-enhanced embed mode. YouTube
still serves the player, so the video owner must allow embedding; this feature does
not download or re-host videos.

### Resource catalog

The supplied learning links are available through the resource catalog:

```text
GET /resources?domain=dsa&topic_id=dsa.dynamic-programming
```

Supported filters include `domain`, `topic_id`, `level`, `resource_type`, and `limit`.
Each resource includes `url` and `can_embed`. YouTube resources can be converted with
`/youtube/embed`; other resources should be displayed as external links unless the
frontend has an appropriate viewer.

## What's placeholder vs. real

- **Placeholder**: `scripts/seed.py` DAG/MCQ/misconception data (small DSA slice, just
  enough to prove the pipeline). Swap for real curriculum IDs.
- **Real, tuned on defaults not real data yet**: BKT params per topic (`topics` table,
  `p_init/p_transit/p_slip/p_guess` — currently flat defaults, not calibrated). Forgetting
  curve constants (`app/forgetting_curve.py`, `BASE_STABILITY_BY_DIFFICULTY`, `K`) are now
  anchored to published spaced-repetition intervals for practiced material (see the
  docstring at the top of that file for the reasoning and sources) instead of an arbitrary
  guess — a real improvement, but still not fit to *this app's* own students, because that
  requires weeks of actual reinject-queue outcomes that don't exist yet. `topics.stability_days_override`
  lets you hand-set or later data-fit a specific topic without touching code.
- **Fully working, no caveats**: BKT update math, root-cause DAG traversal, MCQ lookup
  diagnosis, forgetting-curve retention math, all API wiring + error handling.

## Architecture notes for whoever reads this next

- `app/db.py` is the only place that opens a connection — everything else goes through
  `get_cursor()`. Don't add a second connection path.
- `mastery_state` is written **only** by `bkt.update_mastery()`. If you need to backfill
  or correct mastery (e.g. onboarding diagnostic), go through that function with a
  synthetic `is_correct` sequence, don't write the table directly — keeps the BKT math
  the single source of truth for what "mastery" means anywhere in the system.
- Root-cause tracer picks the **deepest** unmastered ancestor, tie-broken by lowest
  mastery. If you're tempted to simplify this to "return the immediate prerequisite,"
  don't — that collapses the entire value of the feature back to what LeetCode already
  does.

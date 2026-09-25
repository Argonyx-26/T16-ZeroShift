# Stat Models — Input/Output Contract (FINAL — includes onboarding)

For: frontend integration. This is the complete, exact shape of every request and
response the stat-models service sends and receives. Nothing here should change
without updating this doc first — treat it as the source of truth for what to build
against.

Two interchangeable builds exist behind this same contract: a Postgres engine and a
Neo4j engine. **Pick one base URL; every endpoint, request body, and response body
below is identical either way** — the engine is an internal implementation detail.

- Postgres build: `http://localhost:8000` — fully tested end-to-end (real HTTP calls
  against a running Postgres instance, every endpoint below, including error paths).
- Neo4j build: `http://localhost:8001` — same code ported over, syntax-checked, but
  **not yet run against a live Neo4j server** (none available in the environment this
  was verified in). Run the Neo4j build's own smoke test (see the manual steps doc)
  before trusting it for a demo.

**CORS**: both builds have `CORSMiddleware` enabled with `allow_origins=["*"]`, so the
frontend can call these endpoints directly from the browser (any dev server port,
e.g. `localhost:3000`, `localhost:5173`) with no proxy needed. Verified live —
preflight `OPTIONS` and real requests both return `access-control-allow-origin: *`.
Before shipping past the demo, tighten `allow_origins` in `app/main.py` to the real
frontend URL(s) instead of `*`.

**Content-Type**: every `POST` body is JSON — send `Content-Type: application/json`.
`GET` endpoints take query params, no body.

### Quick reference — every endpoint

| Method | Path | Purpose | Body / Query |
|---|---|---|---|
| POST | `/diagnose/mcq` | Diagnose an MCQ answer, update mastery, log attempt | JSON body |
| POST | `/diagnose/code` | Diagnose a code submission, update mastery, log attempt | JSON body |
| POST | `/onboarding/diagnostic` | Run a batch of onboarding diagnostic answers, return starting plan | JSON body |
| POST | `/bkt/update` | Manually update mastery (rarely called by frontend directly) | JSON body |
| GET | `/bkt/mastery` | Read current mastery for a topic | `?student_id=&topic_id=` |
| POST | `/root-cause/trace` | Trace a failing topic back to its root-cause prerequisite | JSON body |
| GET | `/forgetting-curve/run` | Batch job: which mastered topics need a refresher | `?student_id=` |
| GET | `/misconception-history` | Frequency of a specific misconception for a student | `?student_id=&misconception_id=` |
| GET | `/health` | Liveness check | none |

No `PUT`, `PATCH`, or `DELETE` endpoints exist in this service — mastery state is only
ever advanced forward through the diagnose/onboarding/bkt-update flows above, never
edited or removed directly (this is intentional, see `app/db.py`'s note: "frontend/
backend teammates read via API only, never write these tables directly").

---

## 0. Envelope, every response

```json
{ "ok": true, "data": { /* endpoint-specific, see below */ }, "error": null }
```

On failure:

```json
{
  "ok": false,
  "data": null,
  "error": { "code": "TOPIC_NOT_FOUND", "message": "topic_id dsa.dp.lis not found", "retriable": false }
}
```

### Error codes

| code | HTTP status | retriable | meaning |
|---|---|---|---|
| `TOPIC_NOT_FOUND` | 404 | false | topic_id / question_id / option_id doesn't exist |
| `STUDENT_NOT_FOUND` | 404 | false | student_id doesn't exist (not thrown by onboarding — it creates the student) |
| `INSUFFICIENT_DATA` | 200 | false | valid "not enough attempts yet" state — not a failure, check `data` |
| `LLM_TIMEOUT` | 503 | true | code-diagnosis LLM call failed/timed out — already fell back automatically; rare to see directly |

Always check `ok` first. On `ok: false`, `data` is always `null`.

---

## 1a. MCQ diagnosis — `POST /diagnose/mcq`

Call the moment a student picks an MCQ option. Diagnoses, updates BKT mastery, logs
the attempt — one call, one round trip.

**Request**
```json
{
  "student_id": "s_1029",
  "question_id": "q_bfs_014",
  "topic_id": "dsa.graphs.bfs",
  "selected_option_id": "opt_c",
  "response_time_ms": 8400
}
```

**Response — wrong answer**
```json
{
  "ok": true,
  "data": {
    "diagnosis": {
      "student_id": "s_1029", "topic_id": "dsa.graphs.bfs", "is_correct": false,
      "misconception_id": "graph.confuses_bfs_dfs_structure", "error_type": "wrong_approach",
      "confidence": 1.0, "evidence": "distractor-tagged misconception (deterministic lookup)",
      "source": "mcq_lookup"
    },
    "mastery": {
      "student_id": "s_1029", "topic_id": "dsa.graphs.bfs",
      "p_mastery_prev": 0.3, "p_mastery": 0.1932, "mastered": false, "attempts": 1
    }
  },
  "error": null
}
```

**Response — correct answer** (`misconception_id`/`error_type`/`confidence`/`evidence`
are `null`):
```json
{
  "ok": true,
  "data": {
    "diagnosis": {
      "student_id": "s_1029", "topic_id": "dsa.graphs.bfs", "is_correct": true,
      "misconception_id": null, "error_type": null, "confidence": null, "evidence": null,
      "source": "mcq_lookup"
    },
    "mastery": {
      "student_id": "s_1029", "topic_id": "dsa.graphs.bfs",
      "p_mastery_prev": 0.1932, "p_mastery": 0.5909, "mastered": false, "attempts": 2
    }
  },
  "error": null
}
```
Verified live against Postgres — these are real response values from a running instance.

---

## 1b. Code diagnosis — `POST /diagnose/code`

Call after running the student's code against test cases + static analysis (that step
happens elsewhere — this endpoint expects results already computed).

**Request**
```json
{
  "student_id": "s_1029", "problem_id": "p_lis_003", "topic_id": "dsa.dp.lis",
  "code": "def lis(nums):\n    ...", "language": "python",
  "test_results": [
    {"test_id": "t1", "passed": true, "input_size": 4},
    {"test_id": "t2", "passed": false, "input_size": 0, "expected": 0, "actual": "IndexError"}
  ],
  "static_analysis": { "cyclomatic_complexity": 4, "time_complexity_estimate": "O(n^2)", "flags": ["no_empty_input_guard"] }
}
```
`static_analysis.flags` recognized: `no_empty_input_guard`, `off_by_one`. Send `[]` if none.

**Response**
```json
{
  "ok": true,
  "data": {
    "diagnosis": {
      "student_id": "s_1029", "topic_id": "dsa.dp.lis", "is_correct": false,
      "misconception_id": "dp.missing_base_case", "error_type": "edge_case_missed",
      "confidence": 0.65,
      "evidence": "Fails on smallest input (size=0); static analysis flags missing empty-input guard.",
      "source": "code_rule_based"
    },
    "mastery": {
      "student_id": "s_1029", "topic_id": "dsa.dp.lis",
      "p_mastery_prev": 0.3, "p_mastery": 0.1932, "mastered": false, "attempts": 1
    }
  },
  "error": null
}
```

`diagnosis.source` values:

| source | meaning |
|---|---|
| `code_rule_based` | heuristic classifier (default, `USE_LLM_DIAGNOSIS=false`) |
| `code_llm_pass` | real LLM classifier ran successfully |
| `code_rule_fallback_after_llm_timeout` | LLM enabled but timed out — fell back automatically, never a hard failure |

---

## 1c. Onboarding diagnostic — `POST /onboarding/diagnostic`  *(new)*

Call once at signup, after the student answers a short diagnostic quiz per subject.
Creates the student record, runs every response through the same diagnosis+BKT
pipeline as normal practice (so nothing downstream needs special-casing for
"this happened during onboarding"), and returns a ready-to-render starting plan.

**Request**
```json
{
  "student_id": "s_new01",
  "target_role": "sde",
  "timeline_weeks": 8,
  "responses": [
    { "question_id": "q_bfs_014", "selected_option_id": "opt_c" },
    { "question_id": "q_dp_002",  "selected_option_id": "opt_b" },
    { "question_id": "q_2p_001",  "selected_option_id": "opt_a" }
  ]
}
```
`target_role` and `timeline_weeks` are optional but should be sent when you have them
— they're stored on the student record for later use (e.g. tuning plan pacing).
`responses` must be non-empty; every `question_id`/`selected_option_id` pair is
validated **before any writes happen** — if one entry is bad, the whole call fails
and nothing is written (no partial mastery updates to clean up on retry).

**Response**
```json
{
  "ok": true,
  "data": {
    "student_id": "s_new01",
    "target_role": "sde",
    "timeline_weeks": 8,
    "per_response": [
      {
        "question_id": "q_bfs_014",
        "diagnosis": { "student_id": "s_new01", "topic_id": "dsa.graphs.bfs", "is_correct": false,
                       "misconception_id": "graph.confuses_bfs_dfs_structure", "error_type": "wrong_approach",
                       "confidence": 1.0, "evidence": "distractor-tagged misconception (deterministic lookup)",
                       "source": "mcq_lookup" },
        "mastery": { "student_id": "s_new01", "topic_id": "dsa.graphs.bfs",
                     "p_mastery_prev": 0.3, "p_mastery": 0.1932, "mastered": false, "attempts": 1 }
      }
      /* ... one entry per response, same shape as diagnose/mcq's data ... */
    ],
    "per_topic_mastery": [
      { "topic_id": "dsa.graphs.bfs", "domain": "dsa", "p_mastery": 0.1932, "mastered": false },
      { "topic_id": "dsa.dp.lis", "domain": "dsa", "p_mastery": 0.1932, "mastered": false },
      { "topic_id": "dsa.arrays.two_pointer", "domain": "dsa", "p_mastery": 0.7098, "mastered": false }
    ],
    "domain_summary": [
      { "domain": "dsa", "avg_mastery": 0.3654, "topics_assessed": ["dsa.graphs.bfs", "dsa.dp.lis", "dsa.arrays.two_pointer"] }
    ],
    "recommended_starting_plan": ["dsa.graphs.bfs", "dsa.dp.lis", "dsa.arrays.two_pointer"]
  },
  "error": null
}
```

Render fields:
- `per_topic_mastery` → the "here's where you're starting" summary screen.
- `domain_summary` → per-subject (dsa / system_design / web_dev / dbms) averages, for
  a "you're strongest in X, weakest in Y" callout.
- `recommended_starting_plan` → ordered topic list; render as Day 1 / Week 1 content.
  Algorithm: weakest topics first, round-robined across domains so one weak subject
  doesn't dominate the whole first week — documented in `app/onboarding.py`, not a
  black box.

**Error — bad question/option in the batch** (nothing written, safe to fix and retry):
```json
{
  "ok": false, "data": null,
  "error": {
    "code": "TOPIC_NOT_FOUND",
    "message": "question_id q_2p_001 / option opt_z not found (validated before any writes — no partial batch applied)",
    "retriable": false
  }
}
```

Verified live against Postgres, including the "bad entry → zero writes" guarantee.

---

## 2. BKT mastery

### `POST /bkt/update`
Rarely called directly by the frontend — `/diagnose/mcq`, `/diagnose/code`, and
`/onboarding/diagnostic` already call this internally. Exposed for manual overrides.

**Request**
```json
{ "student_id": "s_1029", "topic_id": "dsa.dp.lis", "is_correct": false }
```
**Response**
```json
{
  "ok": true,
  "data": { "student_id": "s_1029", "topic_id": "dsa.dp.lis",
            "p_mastery_prev": 0.3, "p_mastery": 0.1957, "mastered": false, "attempts": 1 },
  "error": null
}
```
`mastered` flips to `true` at `p_mastery >= 0.85`.

### `GET /bkt/mastery?student_id=s_1029&topic_id=dsa.dp.lis`
Use to render a mastery bar/badge without submitting an attempt.

**Has attempts**
```json
{ "ok": true, "data": { "topic_id": "dsa.dp.lis", "p_mastery": 0.1957, "attempts": 1,
  "last_updated": "2026-09-25T10:14:02.331+00:00" }, "error": null }
```
**No attempts yet** — valid state, not an error:
```json
{ "ok": true, "data": null, "error": null }
```

---

## 3. Root-cause trace — `POST /root-cause/trace`

Call when a student is stuck and you want to show *why* — the deepest unmastered
prerequisite, not just the immediate one.

**Request**
```json
{ "student_id": "s_1029", "failing_topic_id": "dsa.dp.lis", "mastery_threshold": 0.6 }
```
`mastery_threshold` optional, defaults `0.6`.

**Root cause found**
```json
{
  "ok": true,
  "data": {
    "student_id": "s_1029", "failing_topic_id": "dsa.dp.lis",
    "root_cause_topic_id": "dsa.recursion.base_cases",
    "path": ["dsa.dp.lis", "dsa.dp.memoization", "dsa.recursion.general", "dsa.recursion.base_cases"],
    "path_mastery": [0.1957, 0.3, 0.58, 0.41],
    "root_cause_found": true
  },
  "error": null
}
```
**No unmastered ancestor** (failure is local to this topic):
```json
{
  "ok": true,
  "data": { "student_id": "s_1029", "failing_topic_id": "dsa.dp.lis",
            "root_cause_topic_id": "dsa.dp.lis", "path": ["dsa.dp.lis"],
            "path_mastery": [0.1957], "root_cause_found": false },
  "error": null
}
```
Always check `root_cause_found` before showing a "this traces back to..." message.

---

## 4. Forgetting curve — `GET /forgetting-curve/run?student_id=s_1029`

Batch job: checks every mastered topic, estimates retention, queues anything decayed
below threshold for a low-stakes refresher. Call on session start, not every page load.

**Response**
```json
{
  "ok": true,
  "data": {
    "student_id": "s_1029", "as_of": "2026-09-25T10:20:11.004+00:00",
    "reinject_queue": [
      { "topic_id": "dsa.graphs.bfs", "last_correct": "2026-08-12T10:20:11.004+00:00",
        "days_elapsed": 44.0, "stability_days": 62.0, "retention": 0.4894, "action": "reinject_low_stakes" }
    ],
    "stable": [ { "topic_id": "dsa.arrays.two_pointer", "retention": 0.91 } ]
  },
  "error": null
}
```
`reinject_queue` → surface as "quick refresher" prompts; `stable` is informational.

---

## 5. Misconception history — `GET /misconception-history?student_id=s_1029&misconception_id=dp.missing_base_case`

Use to build the "this showed up in 3 of your last 4 attempts" line.

**Response**
```json
{
  "ok": true,
  "data": { "student_id": "s_1029", "misconception_id": "dp.missing_base_case",
            "total_occurrences": 3, "occurrences_in_last_4_topic_attempts": 3, "attempts_considered": 4 },
  "error": null
}
```
- `total_occurrences` — all-time count.
- `occurrences_in_last_4_topic_attempts` — of the last ≤4 attempts on this
  misconception's topic, how many were this exact misconception.
- `attempts_considered` — how many attempts actually existed (may be < 4 early on;
  check before wording as "X of your last 4").

---

## 6. Health check — `GET /health`
```json
{ "ok": true }
```
Not wrapped in the standard envelope.

---

## End-to-end example (matches the demo script)

1. **Onboarding**: `POST /onboarding/diagnostic` with a few diagnostic answers →
   returns starting mastery per topic + a starting plan. Render that as the Day 1 plan.
2. Student attempts an LIS (DP) problem 4 times (1 pass, 3 fail on the empty-array
   edge case): `POST /diagnose/code` ×4 → mastery drifts down toward ~0.2.
3. `GET /misconception-history?...misconception_id=dp.missing_base_case` → `3 of 4`.
4. `POST /root-cause/trace` with `failing_topic_id: "dsa.dp.lis"` → traces back to
   `dsa.recursion.base_cases`.
5. Compose client-side: *"You're consistently missing the base case in recursive
   solutions before moving to memoization — this showed up in 3 of your last 4 DP
   attempts, and traces back to a gap in your recursion fundamentals."*
6. On every session start: `GET /forgetting-curve/run` → anything in `reinject_queue`
   becomes a "quick refresher" prompt before new material.

---

## Field glossary

| field | type | notes |
|---|---|---|
| `student_id`, `topic_id`, `question_id`, `misconception_id` | string | dot-namespaced, e.g. `dsa.dp.lis`, `dp.missing_base_case` — opaque, don't parse |
| `p_mastery` | float, 0–1 | BKT posterior mastery; ≥0.85 = mastered |
| `confidence` | float 0–1 or `null` | `null` for a correct answer (nothing to diagnose) |
| `error_type` | enum or `null` | `wrong_approach`, `edge_case_missed`, `complexity_issue`, `off_by_one`, `syntax`, `conceptual_gap` |
| `domain` | string | `dsa` \| `system_design` \| `web_dev` \| `dbms` |
| timestamps | ISO 8601 string | always UTC, pre-formatted — no client conversion needed |

## Known limitations (as of this doc)

- BKT params (`p_init/p_transit/p_slip/p_guess`) and forgetting-curve constants are
  flat defaults, not calibrated on real data yet — `p_mastery` values are directionally
  right, not precisely tuned.
- Seed data is a small placeholder DSA slice — swap in real curriculum IDs before demo.
- Neo4j build has the same code as Postgres (including the onboarding fix below) but
  has not been run against a live Neo4j server in this environment — run its own smoke
  test before relying on it.

## Changelog

- **Added `POST /onboarding/diagnostic`** (doc section 5.6) — previously missing;
  onboarding had no dedicated endpoint.
- **Fixed a partial-write bug** in the onboarding batch: diagnosis+BKT+attempt-log each
  commit independently per question, so a bad `question_id`/`option_id` later in a
  multi-question batch used to leave earlier questions' mastery updates already
  written when the request errored. Now every response in the batch is validated
  before any writes happen — a bad entry fails the whole call with zero side effects.

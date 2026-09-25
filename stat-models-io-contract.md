# Stat Models — I/O Contract (v1)

Owner: [your name] · Consumers: frontend (companion UI, dashboard, practice-set renderer)
Scope: BKT engine, misconception diagnosis, prerequisite root-cause tracer, forgetting-curve scheduler.
Not in this doc: peer-matching/engagement scoring, resource verification, VS Code extension transport (separate contract).

All endpoints return `{ "ok": bool, "data": {...} | null, "error": {...} | null }`. Error shape at bottom. Timestamps are ISO-8601 UTC. Probabilities are floats in `[0,1]`, 4 decimal places.

---

## 0. Shared types

```ts
type TopicId = string        // e.g. "dsa.dp.knapsack", dot-namespaced, matches DAG node IDs
type MisconceptionId = string // e.g. "dp.missing_base_case", stable across content versions
type StudentId = string
type Difficulty = 1 | 2 | 3 | 4 | 5

interface MasteryState {
  topic_id: TopicId
  p_mastery: number          // BKT P(L_t) — current mastery probability
  attempts: number
  last_updated: string       // ISO timestamp
}
```

Pipeline order (matches architecture diagram): `submission → misconception diagnosis → BKT update → root-cause trace → forgetting-curve refresh → next-item selection`. Frontend mainly consumes the outputs of steps 2, 4, 5 for the "why you're stuck" panel and the practice-set queue.

---

## 1. Misconception Diagnosis Agent

Two input paths (MCQ, code), one output shape.

### 1a. MCQ path — Input
```json
{
  "student_id": "s_1029",
  "question_id": "q_bfs_014",
  "topic_id": "dsa.graphs.bfs",
  "selected_option_id": "opt_c",
  "correct_option_id": "opt_a",
  "response_time_ms": 41200
}
```
Every distractor is pre-tagged at content-creation time: `opt_c → misconception_id: "graph.confuses_bfs_dfs_structure"`. This lookup is O(1), no model call.

### 1b. Code path — Input
```json
{
  "student_id": "s_1029",
  "problem_id": "p_lis_003",
  "topic_id": "dsa.dp.lis",
  "code": "def lis(nums):\n    ...",
  "language": "python",
  "test_results": [
    { "test_id": "t1", "passed": true, "input_size": 4 },
    { "test_id": "t2", "passed": false, "input_size": 0, "expected": 0, "actual": "IndexError" }
  ],
  "static_analysis": {
    "cyclomatic_complexity": 4,
    "time_complexity_estimate": "O(n^2)",
    "flags": ["no_empty_input_guard"]
  }
}
```
Static analysis + failing tests are passed to the LLM classifier constrained to structured output (no free text).

### Output (both paths, unified)
```json
{
  "student_id": "s_1029",
  "topic_id": "dsa.dp.lis",
  "misconception_id": "dp.missing_base_case",
  "error_type": "edge_case_missed",     // enum: wrong_approach | edge_case_missed | complexity_issue | off_by_one | syntax | conceptual_gap
  "confidence": 0.87,
  "evidence": "Fails on empty input (t2); no guard before indexing nums[0]. Approach (O(n^2) DP) is otherwise correct.",
  "source": "code_llm_pass"             // enum: mcq_lookup | code_llm_pass
}
```
`confidence < 0.5` → frontend should not surface this as a definitive diagnosis; render as "possible gap" or suppress. This threshold is a UI decision, not baked into the model.

---

## 2. Bayesian Knowledge Tracing Engine

Standard 4-parameter BKT per (student, topic). Params are per-topic, calibrated offline from item stats — not per-student.

### Input
```json
{
  "student_id": "s_1029",
  "topic_id": "dsa.dp.lis",
  "is_correct": false,
  "params": { "p_init": 0.3, "p_transit": 0.15, "p_slip": 0.1, "p_guess": 0.2 }
}
```
`params` optional — engine falls back to topic defaults from the params table if omitted. Frontend never needs to send these; included here for completeness since you own the model.

### Update rule
```
P(L_t | evidence) =
  if correct:   P(L_t-1)(1-p_slip) / [P(L_t-1)(1-p_slip) + (1-P(L_t-1))·p_guess]
  if incorrect: P(L_t-1)·p_slip     / [P(L_t-1)·p_slip     + (1-P(L_t-1))·(1-p_guess)]

P(L_t) = P(L_t | evidence) + (1 - P(L_t | evidence))·p_transit
```
`p_mastery` output is `P(L_t)` after the transit step (posterior predictive, not the filtered estimate — this is the value that should drive "mastered" thresholding).

### Output
```json
{
  "student_id": "s_1029",
  "topic_id": "dsa.dp.lis",
  "p_mastery_prev": 0.42,
  "p_mastery": 0.36,
  "mastered": false,          // threshold: p_mastery >= 0.85, configurable, not hardcoded in payload
  "attempts": 4
}
```

---

## 3. Prerequisite-Graph Root-Cause Tracer

DAG is hand-curated, static per domain (DSA/SD/web-dev/DBMS). Traversal: backward BFS from the failing node over `prerequisite_of` edges, returning the *earliest* ancestor whose `p_mastery < threshold`, not just the immediate parent — this is the whole point of the feature, don't let frontend or teammates flatten it to "parent topic."

### Input
```json
{
  "student_id": "s_1029",
  "failing_topic_id": "dsa.dp.lis",
  "mastery_threshold": 0.6
}
```

### Output
```json
{
  "student_id": "s_1029",
  "failing_topic_id": "dsa.dp.lis",
  "root_cause_topic_id": "dsa.recursion.base_cases",
  "path": [
    "dsa.dp.lis",
    "dsa.dp.memoization",
    "dsa.recursion.base_cases"
  ],
  "path_mastery": [0.36, 0.58, 0.41],
  "root_cause_found": true,
  "narrative": "Consistently missing the base case in recursive solutions before moving to memoization — traces to a gap in recursion fundamentals."
}
```
If every ancestor is above threshold (`root_cause_found: false`), `root_cause_topic_id` falls back to `failing_topic_id` itself — frontend should not special-case null, just render it as "no deeper cause found, this is the gap."

---

## 4. Forgetting-Curve Retention Model

Simplified Ebbinghaus/SM-2 hybrid. Runs as a batch job per student (nightly, or on session start) over all `mastered` topics, not called per-question.

### Formula
```
S (stability, days) = base_stability(difficulty) × (1 + k × mastery_confidence)
R(t) = exp(-t / S)      // t = days since last correct application

reinject if R(t) < R_threshold   (default 0.75)
```
`base_stability` and `k` are calibrated constants, not learner-specific inputs — keep them server-side, don't expose as tunables to frontend.

### Input (batch)
```json
{
  "student_id": "s_1029",
  "as_of": "2026-09-25T00:00:00Z"
}
```

### Output
```json
{
  "student_id": "s_1029",
  "as_of": "2026-09-25T00:00:00Z",
  "reinject_queue": [
    {
      "topic_id": "dsa.graphs.bfs",
      "last_correct": "2026-08-12T10:00:00Z",
      "days_elapsed": 44,
      "stability_days": 51.2,
      "retention": 0.702,
      "action": "reinject_low_stakes"
    }
  ],
  "stable": [
    { "topic_id": "dsa.arrays.two_pointer", "retention": 0.94 }
  ]
}
```
Only `reinject_queue` entries should surface in the practice-set UI, and only ever as one low-stakes item per topic per session — that pacing rule lives in the scheduler, not this payload, so don't let frontend re-derive it from raw retention numbers.

---

## 5. End-to-end worked trace

Matches the UX example in the project doc ("You're consistently missing the base case..."). This is the sequence frontend needs to render as one coherent card, not four separate API calls shown as four separate widgets.

```
1. Code submission (p_lis_003) fails t2 (empty input)
   → Misconception Agent: { misconception_id: "dp.missing_base_case", confidence: 0.87 }
2. BKT update on "dsa.dp.lis"
   → p_mastery: 0.42 → 0.36
3. Root-cause trace from "dsa.dp.lis"
   → root_cause_topic_id: "dsa.recursion.base_cases", path_mastery: [0.36, 0.58, 0.41]
4. Frontend composes:
   "You're consistently missing the base case in recursive solutions before
    moving to memoization — this showed up in 3 of your last 4 DP attempts,
    and traces back to a gap in recursion fundamentals from two weeks ago."
   (the "3 of last 4" and "two weeks ago" come from querying misconception
    history + MasteryState.last_updated on the root_cause node — not returned
    by any single call above; frontend needs a 5th lightweight call:
    GET /misconception-history?student_id=&misconception_id= for the count,
    and last_updated on the root cause's MasteryState for the recency phrase.)
```

---

## 6. Error format
```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "TOPIC_NOT_FOUND",
    "message": "topic_id dsa.dp.lisss not in prerequisite DAG",
    "retriable": false
  }
}
```
Codes to handle on frontend: `TOPIC_NOT_FOUND`, `INSUFFICIENT_DATA` (fewer than 2 attempts on a topic — BKT/tracer won't return a confident result, show "not enough data yet" state, not an error toast), `LLM_TIMEOUT` (retriable, code-path misconception diagnosis only — fall back to showing pass/fail only, backfill diagnosis async).

## 7. Open items (not blocking frontend)
- BKT params table (per-topic p_init/p_transit/p_slip/p_guess) — calibrating from item stats, will ship before demo.
- `mastery_threshold` (0.6) and `R_threshold` (0.75) are current defaults, may tune after simulated-data runs.

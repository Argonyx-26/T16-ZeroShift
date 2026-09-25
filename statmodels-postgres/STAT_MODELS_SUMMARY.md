# Stat Models Backend: Complete Project Summary

## 1. My Contribution

I developed the adaptive-learning backend for the project. This backend is the
intelligence layer that analyzes student learning activity and returns useful
information to the frontend.

The backend helps answer:

- What topic does the student understand?
- What topic is the student struggling with?
- Why did the student make a mistake?
- Is the real problem a missing prerequisite concept?
- Which mastered topics may need revision?
- How should the student's mastery score change after an attempt?

The implementation is located in the `statmodels-postgres` folder.

## 2. Where It Fits in the Full Project

```text
React/Next.js frontend
        |
        | HTTP requests and JSON responses
        v
FastAPI stat-model backend
        |
        | calculations, diagnosis, scheduling
        v
PostgreSQL database
```

The frontend displays pages and collects student actions. This backend processes
those actions, updates the student's learning state, stores attempts, and sends
results back to the frontend.

This folder is not the React/Next.js website. It is a standalone Python API that
the website can call.

## 3. Technology Used

- Python
- FastAPI
- Pydantic request validation
- PostgreSQL
- Psycopg2 database driver
- Uvicorn development server
- Optional Anthropic API integration for LLM-assisted code diagnosis

## 4. Main Features Implemented

### 4.1 MCQ Misconception Diagnosis

The frontend sends a student's selected answer. The backend looks up the question
and its misconception mapping to determine whether the student made a known type
of mistake.

Example misconceptions include:

- confusing BFS and DFS behavior
- off-by-one errors in binary search
- misunderstanding joins

The endpoint then updates mastery and records the attempt.

### 4.2 Code Submission Diagnosis

The frontend can send code, language, test results, and static-analysis results.
The backend classifies the likely reason for failure, such as:

- wrong algorithm or approach
- missed edge case
- off-by-one error
- time-complexity issue

The system has a rule-based diagnosis path that works without an LLM. An optional
LLM path can be enabled with `USE_LLM_DIAGNOSIS=true`. If the LLM call fails or
times out, the rule-based fallback is used.

### 4.3 Bayesian Knowledge Tracing

Bayesian Knowledge Tracing, or BKT, estimates the probability that a student has
mastered a topic.

```text
Student answers a question
        ->
Backend observes correct or incorrect result
        ->
Mastery probability is updated
        ->
Updated mastery is saved in PostgreSQL
```

The BKT parameters include initial knowledge, learning transition, slip, and
guess probabilities. Mastery updates are centralized in `app/bkt.py`.

### 4.4 Attempt Logging

MCQ and code diagnosis calls save the attempt together with the diagnosis and
updated mastery. This gives the system a history of the student's learning
behavior instead of only returning a one-time score.

### 4.5 Prerequisite Root-Cause Tracing

Topics are stored as a prerequisite graph. For example:

```text
Recursion -> Backtracking -> Dynamic Programming
```

When a student struggles with an advanced topic, the backend searches the graph
for a deeper unmastered prerequisite. This lets the platform say that a dynamic
programming problem may actually be exposing a recursion gap.

### 4.6 Forgetting-Curve Revision

The backend estimates how much knowledge a student is likely to retain over time.
When a topic's predicted retention drops below the configured threshold, the
backend returns it as due for revision.

The frontend can add those topics to the next practice session.

This mechanism is implemented, but its parameters still need calibration using
real longitudinal student data.

### 4.7 Personalized Onboarding

The onboarding endpoint accepts the student's target role, interview timeline,
and diagnostic responses. It returns an initial assessment and starting direction.

### 4.8 Misconception History

The backend reports how often a misconception occurred overall and how often it
appeared in the student's most recent attempts on that topic.

### 4.9 YouTube Resource Embedding

The backend accepts a YouTube watch, Shorts, embed, or `youtu.be` URL and converts
it into a validated privacy-enhanced embed URL.

Example:

```text
Input:  https://www.youtube.com/watch?v=dQw4w9WgXcQ
Output: https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ
```

The frontend can use the returned URL in an iframe so the learner stays on the
platform. YouTube still hosts the video, and the video owner must allow embedding.
This does not download or re-host videos.

This feature applies to YouTube URLs only. Other resources such as articles, PDFs,
LeetCode, or GFG links still require a separate viewer or may open externally.

### 4.10 Curated Resource Catalog

The supplied learning links are structured in `app/resources.py` and exposed through
`GET /resources`. The catalog covers DSA, DBMS, System Design, and Web Development
resources with topic, difficulty level, resource type, duration, URL, and `can_embed`
metadata. The frontend can filter the catalog and decide whether to render a YouTube
item inside the website or show an external link.

## 5. API Endpoints for the Frontend

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

### Code diagnosis

```text
POST /diagnose/code
```

```json
{
  "student_id": "student-1",
  "problem_id": "two-sum",
  "topic_id": "arrays",
  "code": "def solve(nums, target): ...",
  "language": "python",
  "test_results": [{"name": "basic", "passed": false}],
  "static_analysis": {}
}
```

Returns `data.diagnosis` and `data.mastery`, and logs the attempt.

### Direct mastery update

```text
POST /bkt/update
```

```json
{
  "student_id": "student-1",
  "topic_id": "arrays",
  "is_correct": true
}
```

### Read mastery

```text
GET /bkt/mastery?student_id=student-1&topic_id=arrays
```

### Onboarding diagnostic

```text
POST /onboarding/diagnostic
```

```json
{
  "student_id": "student-1",
  "target_role": "backend",
  "timeline_weeks": 12,
  "responses": [
    {"question_id": "arrays-q1", "selected_option_id": "option-a"}
  ]
}
```

### Root-cause tracing

```text
POST /root-cause/trace
```

```json
{
  "student_id": "student-1",
  "failing_topic_id": "dynamic-programming",
  "mastery_threshold": 0.6
}
```

### Forgetting-curve revision

```text
GET /forgetting-curve/run?student_id=student-1
```

Returns topics that may be due for revision.

### Misconception history

```text
GET /misconception-history?student_id=student-1&misconception_id=off-by-one
```

Returns total occurrences, recent occurrences, and the number of recent attempts
considered.

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

## 6. Folder Structure

```text
statmodels-postgres/
|-- app/
|   |-- main.py                FastAPI app and HTTP endpoints
|   |-- bkt.py                 Bayesian Knowledge Tracing logic
|   |-- misconceptions.py      MCQ and code diagnosis logic
|   |-- attempts.py            Attempt logging
|   |-- root_cause.py          Prerequisite graph tracing
|   |-- forgetting_curve.py    Retention and revision scheduling
|   |-- onboarding.py          Onboarding diagnostic logic
|   |-- db.py                  PostgreSQL connection/cursor helper
|   |-- resources.py           Curated learning-resource catalog and filters
|   `-- errors.py              Application error types
|-- db/
|   `-- schema.sql             PostgreSQL tables and indexes
|-- scripts/
|   |-- seed.py                Demo topics, questions, and misconceptions
|   |-- import_question_bank.py JSON MCQ bank importer
|   `-- demo_trace.py          End-to-end database demonstration
|-- requirements.txt           Python dependencies
|-- README.md                  Backend setup and endpoint notes
|-- FRONTEND_HANDOFF.md        Frontend integration guide
|-- FRONTEND_INTEGRATION_GUIDE.md React/Next.js integration examples
|-- PROJECT_INTEGRATION_GUIDE.md Complete database/API/frontend setup
`-- STAT_MODELS_SUMMARY.md     This complete summary
```

## 7. How to Run the Backend

From the `statmodels-postgres` directory:

```bash
pip install -r requirements.txt
psql -U postgres -c "CREATE DATABASE statmodels"
psql -U postgres -d statmodels -f db/schema.sql
PYTHONPATH=. python scripts/seed.py
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

Interactive API documentation is available at:

```text
http://localhost:8000/docs
```

Additional generated API documentation is available at:

```text
http://localhost:8000/redoc
http://localhost:8000/openapi.json
```

Swagger groups the endpoints by feature and includes route summaries, descriptions,
query parameter guidance, request schemas, and the YouTube validation error response.
The frontend team can use `/docs` to try calls, `/redoc` as a readable reference, or
`/openapi.json` to import the contract into API tools.

The frontend developer runs the API and calls these endpoints using `fetch`, Axios,
or another HTTP client.

### Resource catalog

```text
GET /resources?domain=dsa&topic_id=dsa.dynamic-programming&level=intermediate
```

This returns the curated resource list in `data.resources`. It is a structured
catalog and filter endpoint; automated link liveness, freshness scoring, embedding
similarity, and misconception-specific ranking remain future enhancements.

### Question selection

The database now stores a `difficulty` value on every MCQ: `easy`, `intermediate`,
or `hard`. The frontend can request a randomized batch:

```text
GET /questions?domain=dsa&difficulty=easy&count=10
GET /questions?topic_id=dsa.graphs.bfs&difficulty=hard&count=5
GET /questions/batch?domain=dsa&easy_count=5&intermediate_count=3&hard_count=2
```

The response contains question text, options, topic, domain, and difficulty. After a
learner answers, the frontend sends the selected option to `/diagnose/mcq`, which
updates mastery and logs the attempt.

`/questions/batch` is the exact lookup-table workflow requested by the project: it
selects separate random groups for easy, intermediate, and hard and returns requested,
returned, and shortage counts.

The importer at `scripts/import_question_bank.py` accepts corrected JSON questions,
validates their difficulty/options, creates missing topic rows, and loads them into
`mcq_questions` and `mcq_options`.

### SQL-backed study materials

Materials are stored in the PostgreSQL `study_materials` table and served through:

```text
GET /study-materials?domain=dsa&display_mode=video
GET /study-materials?domain=dbms&display_mode=file
GET /study-materials?domain=web_dev&display_mode=external_link
```

Each material includes `material_type`, `display_mode`, `url`, `level`, `duration`,
and `can_embed`:

- `video`: send the URL to `/youtube/embed` and render the returned iframe URL.
- `file`: show a document/article card or approved viewer.
- `external_link`: open the original URL on its source website.

`GET /resources` is retained as a compatibility endpoint and reads the same SQL
material catalog.

## 8. What Is Complete

For the current project demo, the Stat Models backend is functionally complete:

- core model logic is implemented
- API routes are connected
- PostgreSQL persistence is wired
- MCQ and code attempts update mastery
- attempts are logged
- root-cause and forgetting-curve flows are available
- onboarding is available
- frontend endpoint documentation exists
- YouTube embed conversion is available
- Curated resource catalog and frontend filtering endpoint are available
- SQL-backed study-material catalog with video/file/external-link display modes
- Difficulty-filtered randomized MCQ batch endpoint
- Exact mixed-difficulty MCQ batch endpoint
- JSON importer for the corrected 240-question bank
- Word/plain-text question-bank parser with strict 240-question validation
- Configurable production CORS through `FRONTEND_ORIGINS`
- Automated resource-catalog tests
- Python syntax validation and standalone YouTube conversion checks passed

## 9. What Is Not Production-Complete Yet

These items are outside the completed demo backend or need future validation:

- placeholder demo seed data must be replaced with real curriculum content
- BKT and forgetting-curve parameters need real student-data calibration
- authentication and authorization are not implemented
- the React/Next.js frontend still needs to consume and display the API results
- complete resource recommendation requires link liveness, relevance, freshness,
  and fallback-resource logic
- the complete question source from the latest attachment must be saved as a text file
  and run through `scripts/parse_question_bank.py`; the parser validates 60 questions
  per domain, four options, and an answer before SQL import. The attachment itself is
  now complete enough to import; it is not stored in this workspace as a file yet.
- adaptive item generation is not part of this folder
- peer-group matching and engagement scoring are not part of this folder
- the VS Code companion and desktop overlay are separate project work

## 10. Final Explanation for the Team

> I built the adaptive-learning backend. It receives MCQ and code attempts, identifies
> misconceptions, updates topic mastery using Bayesian Knowledge Tracing, logs attempts,
> traces weaknesses to prerequisite concepts, schedules revision using forgetting-curve
> logic, supports onboarding diagnostics, and exposes HTTP APIs for the frontend. I also
> added YouTube embed conversion so supported learning videos can play inside the website.
> The demo backend is functionally complete, while production hardening, real curriculum
> data, calibration, and the remaining frontend/platform features are future work.



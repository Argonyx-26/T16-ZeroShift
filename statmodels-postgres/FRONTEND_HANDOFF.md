## Frontend Handoff: Stat Models API

This document is for the frontend developer integrating the adaptive-learning backend.

For copy-ready JavaScript helpers and component examples, also read
`FRONTEND_INTEGRATION_GUIDE.md`.
For database setup and the complete project connection flow, read
`PROJECT_INTEGRATION_GUIDE.md`.

## What This Folder Is

`statmodels-postgres` is a Python FastAPI service backed by PostgreSQL. It owns the
learning intelligence and persistence layer:

...

### List curated learning resources

`GET /resources`

The supplied DSA, DBMS, System Design, and Web Development links are available from
the resource catalog. Optional filters are:

```text
/resources?domain=dsa
/resources?topic_id=dsa.dynamic-programming
/resources?domain=dbms&resource_type=video
/resources?level=beginner&limit=10
```

Each returned resource includes its title, topic, level, type, URL, duration, and
`can_embed` flag. If `can_embed` is `true`, call `/youtube/embed` and render the
returned URL in an iframe. Otherwise, show an external-resource link or use an
appropriate internal viewer.

### Select quiz questions by difficulty

`GET /questions?domain=dsa&difficulty=intermediate&count=10`

The endpoint returns a randomized batch from the SQL question bank. Supported
difficulties are `easy`, `intermediate`, and `hard`. After the learner selects an
option, submit it to `/diagnose/mcq` to update diagnosis, mastery, and attempt history.

For an exact mixed quiz:

```text
GET /questions/batch?domain=dsa&easy_count=5&intermediate_count=3&hard_count=2
```

The response reports the requested count, returned count, and any difficulty
shortages. Use this endpoint for the quiz builder.

### Read study materials from SQL

`GET /study-materials?domain=dbms&display_mode=file`

Materials are stored in PostgreSQL and include `material_type`, `display_mode`, `url`,
and `can_embed`. Render `video` with the YouTube embed endpoint, show `file` materials
in a document/article viewer or card, and redirect `external_link` materials to their
original URL.

## Is Stat Models Fully Done?
# Frontend Handoff: Stat Models API

This document is for the frontend developer integrating the adaptive-learning backend.

## What This Folder Is

`statmodels-postgres` is a Python FastAPI service backed by PostgreSQL. It owns the
learning intelligence and persistence layer:

- misconception diagnosis for MCQ and code attempts
- Bayesian Knowledge Tracing (BKT) mastery updates
- prerequisite-graph root-cause tracing
- forgetting-curve revision scheduling
- onboarding diagnostic routing
- misconception history queries
- YouTube resource URL conversion for in-site playback

It is not the React/Next.js website. The frontend calls this API over HTTP and renders
the returned data. The API currently enables open CORS for local development.

## Running It Locally

From the `statmodels-postgres` directory:

```bash
pip install -r requirements.txt
psql -U postgres -c "CREATE DATABASE statmodels"
psql -U postgres -d statmodels -f db/schema.sql
PYTHONPATH=. python scripts/seed.py
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

The API base URL is `http://localhost:8000`. FastAPI also exposes interactive docs at
`http://localhost:8000/docs`.

## Swagger / OpenAPI Guide

The backend generates the frontend API documentation automatically from the FastAPI
routes. Start the server, then open:

- Swagger UI: `http://localhost:8000/docs` — try endpoints directly and copy request bodies.
- ReDoc: `http://localhost:8000/redoc` — readable reference documentation.
- OpenAPI JSON: `http://localhost:8000/openapi.json` — import into Postman, Insomnia, or code generators.

Routes are grouped in Swagger by `Diagnosis`, `Mastery`, `Onboarding`, `Root Cause`,
`Revision`, `History`, `Resources`, and `System`. The frontend should use the API
base URL plus the path shown in Swagger, for example:

```javascript
const response = await fetch(`${API_BASE_URL}/diagnose/mcq`, {
  method: "POST",
  headers: { "Content-Type": "application/json" },
  body: JSON.stringify({
    student_id: "student-1",
    question_id: "mcq-1",
    topic_id: "arrays",
    selected_option_id: "option-b"
  })
});

const result = await response.json();
if (!result.ok) {
  // Show or handle result.error.code and result.error.message.
}
```

## Response Envelope

Successful endpoints return:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Application errors use the same shape with `ok: false`, `data: null`, and an error
object containing a `code` and message. HTTP validation errors are returned by FastAPI
with status `422`.

## Frontend Endpoints

### Health check

`GET /health`

Use this to check whether the API is reachable. It returns:

```json
{"ok": true}
```

### Diagnose an MCQ attempt

`POST /diagnose/mcq`

Request:

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

The response contains both `data.diagnosis` and the updated `data.mastery`. This call
also records the attempt in PostgreSQL.

### Diagnose a code attempt

`POST /diagnose/code`

Request:

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

The response contains the diagnosis and updated mastery, and records the attempt.
The LLM diagnosis is optional. With `USE_LLM_DIAGNOSIS=false`, the rule-based fallback
keeps this endpoint runnable without an API key.

### Update mastery directly

`POST /bkt/update`

Request:

```json
{
  "student_id": "student-1",
  "topic_id": "arrays",
  "is_correct": true
}
```

Use this for a learning event that is not an MCQ or code diagnosis.

### Read topic mastery

`GET /bkt/mastery?student_id=student-1&topic_id=arrays`

Returns the current BKT state for the student and topic.

### Run onboarding diagnostics

`POST /onboarding/diagnostic`

Request:

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

Returns the onboarding assessment and recommended starting direction.

### Trace a root cause

`POST /root-cause/trace`

Request:

```json
{
  "student_id": "student-1",
  "failing_topic_id": "dynamic-programming",
  "mastery_threshold": 0.6
}
```

Returns the deepest unmastered prerequisite found in the topic graph.

### Run forgetting-curve revision

`GET /forgetting-curve/run?student_id=student-1`

Returns the topics currently due for a revision check and their predicted retention.
The frontend can add the returned items to the next practice session.

### Read misconception history

`GET /misconception-history?student_id=student-1&misconception_id=off-by-one`

Returns total occurrences, occurrences in the last four topic attempts, and
`attempts_considered`.

### Embed a YouTube resource inside the website

`POST /youtube/embed`

Request:

```json
{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
```

Successful response:

```json
{
  "ok": true,
  "data": {
    "embed_url": "https://www.youtube-nocookie.com/embed/dQw4w9WgXcQ"
  },
  "error": null
}
```

Use `data.embed_url` as the `src` of an iframe. Invalid or non-YouTube URLs return
`422` with error code `INVALID_YOUTUBE_URL`. This embeds YouTube's player; it does not
download or re-host the video, and the video owner must permit embedding.

### List curated learning resources

`GET /resources`

The supplied DSA, DBMS, System Design, and Web Development links are available from
the resource catalog. Optional filters are:

```text
/resources?domain=dsa
/resources?topic_id=dsa.dynamic-programming
/resources?domain=dbms&resource_type=video
/resources?level=beginner&limit=10
```

Each returned resource includes its title, topic, level, type, URL, duration, and
`can_embed` flag. If `can_embed` is `true`, call `/youtube/embed` and render the
returned URL in an iframe. Otherwise, show an external-resource link or use an
appropriate internal viewer.

## Is Stat Models Fully Done?

The core backend pipeline is implemented and wired:

- BKT update math and persistence
- MCQ misconception lookup
- code diagnosis with rule-based fallback and optional LLM classification
- prerequisite root-cause traversal
- forgetting-curve retention and revision scheduling
- onboarding diagnostic flow
- attempt logging from MCQ and code diagnosis
- API error envelope and CORS configuration
- YouTube embed URL conversion

It is not fully production-ready or fully validated against real curriculum data yet.
The remaining work includes:

- replace placeholder seed data in `scripts/seed.py` with the actual curriculum
- calibrate BKT and forgetting-curve parameters using real learner outcomes
- connect the frontend to these endpoints and design the learning screens
- add authentication and restrict CORS before deployment
- add automated API tests and run the service against a configured PostgreSQL instance
- add the broader resource verification/recommendation workflow described in the project
  proposal; the current YouTube endpoint only handles safe embed URL conversion

For the current demo scope, the backend is functionally complete. For a shipped
product, it still needs the production items above.
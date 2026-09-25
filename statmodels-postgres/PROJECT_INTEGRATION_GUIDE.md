# Complete Project Integration Guide

This file explains where the Stat Models part is, how it connects to PostgreSQL, how
it starts, and how the React/Next.js frontend connects to it.

## 1. Project Architecture

```text
React / Next.js frontend
        |
        | HTTP JSON requests
        v
FastAPI Stat Models API
        |
        | psycopg2 connection pool
        v
PostgreSQL database
```

The frontend must call the FastAPI API. It must not connect directly to PostgreSQL.
The API performs the diagnosis and learning calculations, updates the database, and
returns JSON for the frontend to render.

## 2. Folder Location

The backend is located at:

```text
C:\Users\manee\zeroshift-features\statmodels-postgres
```

The shareable ZIP is located at:

```text
C:\Users\manee\zeroshift-features\stat-models-part.zip
```

## 3. Important Backend Files

```text
statmodels-postgres/
|-- app/
|   |-- main.py                    FastAPI app, Swagger, and HTTP endpoints
|   |-- db.py                      PostgreSQL connection pool and cursor helper
|   |-- bkt.py                     Bayesian Knowledge Tracing mastery logic
|   |-- misconceptions.py          MCQ and code diagnosis
|   |-- attempts.py                Attempt persistence
|   |-- root_cause.py              Prerequisite graph tracing
|   |-- forgetting_curve.py        Retention and revision scheduling
|   |-- onboarding.py              Initial learner assessment
|   |-- resources.py               Curated DSA/DBMS/system-design/web resources
|   `-- errors.py                  Standard application errors
|-- db/
|   `-- schema.sql                 PostgreSQL tables and indexes
|-- scripts/
|   |-- seed.py                    Demo curriculum and question data
|   |-- import_question_bank.py    Import the complete corrected MCQ JSON bank
|   `-- demo_trace.py              Database smoke demonstration
|-- requirements.txt               Python dependencies
|-- README.md                      Backend notes
|-- FRONTEND_HANDOFF.md            Endpoint handoff
|-- FRONTEND_INTEGRATION_GUIDE.md  JavaScript integration examples
|-- STAT_MODELS_SUMMARY.md         Complete contribution summary
`-- PROJECT_INTEGRATION_GUIDE.md   This file
```

## 4. How PostgreSQL Connects

The only database connection path is `app/db.py`.

It reads the `DATABASE_URL` environment variable. If it is not set, it uses this
local default:

```text
postgresql://postgres:postgres@localhost:5432/statmodels
```

The connection pool creates between 1 and 10 reusable PostgreSQL connections.
All model modules use `get_cursor()` from `app/db.py`:

```text
Frontend request
    -> app/main.py endpoint
    -> model module such as bkt.py or attempts.py
    -> app/db.py get_cursor()
    -> PostgreSQL
    -> JSON response to frontend
```

The frontend never writes directly to the database. This keeps mastery updates
consistent and ensures that BKT calculations are always applied through the backend.

## 5. PostgreSQL Setup on Windows PowerShell

Open PowerShell and move into the backend:

```powershell
Set-Location C:\Users\manee\zeroshift-features\statmodels-postgres
```

Create the database if it does not already exist:

```powershell
psql -U postgres -c "CREATE DATABASE statmodels"
```

If PostgreSQL is configured with a different username or password, use that account.
The default application connection expects:

```text
username: postgres
password: postgres
host: localhost
port: 5432
database: statmodels
```

Apply the schema:

```powershell
psql -U postgres -d statmodels -f db\schema.sql
```

The schema creates tables for:

- `topics`
- `prerequisite_edges`
- `misconceptions`
- `mcq_questions`
- `mcq_options`
- `students`
- `mastery_state`
- `attempts`
- `reinject_queue`

## 6. Seed Demo Data

The current seed is demonstration data, not the final curriculum:

```powershell
$env:PYTHONPATH = "."
python scripts\seed.py
```

It inserts sample DSA topics, prerequisite relationships, misconceptions, one MCQ,
and a sample student. Replace or extend `scripts/seed.py` when the team provides the
real curriculum data.

The curated resources in `app/resources.py` are served from application memory and
are also inserted into the SQL `study_materials` table by `scripts/seed.py`.

## 7. Install Python Dependencies

From `statmodels-postgres`:

```powershell
python -m pip install -r requirements.txt
```

The important packages are:

- `fastapi`: API framework
- `uvicorn`: development server
- `psycopg2-binary`: PostgreSQL driver
- `pydantic`: request validation
- `anthropic`: optional LLM code diagnosis

## 8. Start the API

From `statmodels-postgres`:

```powershell
$env:PYTHONPATH = "."
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```

For deployment, restrict browser access to the real frontend origin:

```powershell
$env:FRONTEND_ORIGINS = "https://your-frontend.example.com"
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Multiple origins can be comma-separated. The default `*` is for local demo use only.

The backend is now available at:

```text
http://localhost:8000
```

Check it with:

```text
http://localhost:8000/health
```

Expected response:

```json
{"ok": true}
```

## 9. Swagger and OpenAPI

FastAPI automatically generates API documentation from `app/main.py`:

```text
Swagger UI:  http://localhost:8000/docs
ReDoc:       http://localhost:8000/redoc
OpenAPI JSON: http://localhost:8000/openapi.json
```

The frontend developer can open Swagger UI, select an endpoint, click `Try it out`,
enter the JSON request, and execute it.

Swagger groups endpoints into:

- System
- Diagnosis
- Mastery
- Onboarding
- Root Cause
- Revision
- History
- Resources

## 10. Frontend Connection

Set the frontend API URL to:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

Use a shared request helper:

```javascript
async function request(path, options = {}) {
  const response = await fetch(`${API_BASE_URL}${path}`, {
    headers: {
      "Content-Type": "application/json",
      ...(options.headers || {})
    },
    ...options
  });

  const body = await response.json();

  if (!response.ok || body.ok === false) {
    const error = body.error || { code: "HTTP_ERROR", message: "Request failed" };
    throw new Error(`${error.code}: ${error.message}`);
  }

  return body.data;
}
```

The full reusable helper is in `FRONTEND_INTEGRATION_GUIDE.md`.

## 11. Frontend Endpoint Map

### Health

```text
GET /health
```

### MCQ diagnosis

```text
POST /diagnose/mcq
```

Updates diagnosis, mastery, and attempt history in one call.

```json
{
  "student_id": "student-1",
  "question_id": "q_bfs_014",
  "topic_id": "dsa.graphs.bfs",
  "selected_option_id": "opt_c",
  "response_time_ms": 8400
}
```

### Code diagnosis

```text
POST /diagnose/code
```

```json
{
  "student_id": "student-1",
  "problem_id": "p_lis_003",
  "topic_id": "dsa.dp.lis",
  "code": "def lis(nums): ...",
  "language": "python",
  "test_results": [{"test_id": "t1", "passed": false}],
  "static_analysis": {"flags": ["no_empty_input_guard"]}
}
```

### Mastery

```text
POST /bkt/update
GET /bkt/mastery?student_id=student-1&topic_id=arrays
```

### Onboarding

```text
POST /onboarding/diagnostic
```

### Root-cause tracing

```text
POST /root-cause/trace
```

### Forgetting-curve revision

```text
GET /forgetting-curve/run?student_id=student-1
```

### Misconception history

```text
GET /misconception-history?student_id=student-1&misconception_id=off-by-one
```

### Curated resources

```text
GET /resources?domain=dsa&topic_id=dsa.dynamic-programming&level=intermediate
```

The response includes resource title, topic, level, type, URL, duration, and
`can_embed`.

### Question lookup and randomized MCQ batches

```text
GET /questions?domain=dsa&difficulty=easy&count=10
GET /questions?topic_id=dsa.graphs.bfs&difficulty=hard&count=5
GET /questions/batch?domain=dsa&easy_count=5&intermediate_count=3&hard_count=2
```

Each question has an `easy`, `intermediate`, or `hard` difficulty value. The endpoint
returns a random batch with options. After the learner answers, send the selected
option to `/diagnose/mcq` so diagnosis, BKT mastery, and attempt logging happen
together. `/questions/batch` is the exact lookup-table workflow: it selects random
rows separately for each requested difficulty and reports any shortage.

The question bank should be loaded into `mcq_questions` and `mcq_options`, with one
row per question and one row per option. The supplied pasted bank contains 60
questions per subject, but several formula expressions are missing from the pasted
text, so those prompts must be restored before importing them into SQL.

After converting the corrected question bank to the documented JSON shape, import it:

```powershell
$env:PYTHONPATH = "."
python scripts\import_question_bank.py data\question-bank.json
```

The importer validates that every question has a difficulty, a correct option, and
options before writing it. It supports `easy`, `intermediate`, and `hard`.

For the supplied Word-exported text, first convert it to importer JSON:

```powershell
$env:PYTHONPATH = "."
python scripts\parse_question_bank.py data\question-bank-source.txt data\question-bank.json
python scripts\import_question_bank.py data\question-bank.json
```

The parser requires exactly 60 questions under each of DSA, DBMS, SYSTEM DESIGN,
and WEB DEVELOPMENT. The latest attachment contains the restored formulas and
options; save that attachment as `data\question-bank-source.txt` first. The parser
fails if a question is missing an option or answer instead of silently inventing data.

### SQL-backed study materials

```text
GET /study-materials?domain=dsa&display_mode=video
GET /study-materials?domain=dbms&display_mode=file
GET /study-materials?domain=web_dev&display_mode=external_link
```

The `study_materials` table stores the curated links. Each material includes
`material_type`, `display_mode`, `url`, and `can_embed` metadata.

Frontend behavior:

- `video`: convert through `/youtube/embed` and render in the platform.
- `file`: show a document/article card or approved viewer.
- `external_link`: open the original URL in a link.

### YouTube embedding

```text
POST /youtube/embed
```

```json
{"url": "https://www.youtube.com/watch?v=dQw4w9WgXcQ"}
```

Use the returned `data.embed_url` as an iframe source when the resource has
`can_embed: true`:

```jsx
<iframe
  src={embedUrl}
  title="Learning video"
  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
  allowFullScreen
/>
```

Articles, documentation, LeetCode, GFG, and other websites are returned as links.
They may not allow iframe embedding.

## 12. Request and Error Contract

Successful response:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

Application error:

```json
{
  "ok": false,
  "data": null,
  "error": {
    "code": "TOPIC_NOT_FOUND",
    "message": "Topic was not found",
    "retriable": false
  }
}
```

The frontend should check both the HTTP status and `ok` before rendering data.

## 13. CORS

Development CORS currently allows local frontend servers such as:

```text
http://localhost:3000
http://localhost:5173
```

The current backend uses `allow_origins=["*"]` for demo convenience. Before
production deployment, replace it with the real frontend HTTPS origin and add
authentication.

## 14. End-to-End Request Example

```text
1. Student answers an MCQ in the frontend.
2. Frontend calls POST /diagnose/mcq.
3. FastAPI validates the JSON body.
4. misconceptions.py identifies correctness and misconception.
5. bkt.py updates mastery and writes mastery_state.
6. attempts.py writes the attempt history.
7. API returns diagnosis and mastery JSON.
8. Frontend displays the explanation and updated progress.
```

For a resource:

```text
1. Frontend calls GET /resources with topic filters.
2. API returns matching curated resources.
3. Frontend checks can_embed.
4. YouTube resources go through POST /youtube/embed.
5. Frontend renders the returned embed URL in an iframe.
6. Other resources open through an external link or approved viewer.
```

## 15. Current Completion Status

The Stat Models backend is functionally complete for the demo:

- FastAPI routes are implemented.
- Swagger/OpenAPI documentation is generated.
- PostgreSQL schema and connection pool are implemented.
- BKT mastery updates are implemented.
- MCQ and code diagnosis are implemented.
- Attempt logging is implemented.
- Root-cause tracing is implemented.
- Forgetting-curve scheduling is implemented.
- Onboarding diagnostics are implemented.
- Curated resource filtering is implemented.
- YouTube embed conversion is implemented.
- Frontend integration documentation is included.

Production work still needed:

- replace placeholder seed data with the final curriculum
- add authentication and authorization
- calibrate BKT and forgetting-curve parameters with real learner data
- add link liveness, freshness, and misconception-specific resource ranking
- complete the React/Next.js screens and user flows

Backend checks included now:

```powershell
$env:PYTHONPATH = "."
python -m unittest discover tests
```

## 16. Files the Frontend Teammate Should Read

1. `PROJECT_INTEGRATION_GUIDE.md` — complete setup and architecture
2. `FRONTEND_INTEGRATION_GUIDE.md` — copy-ready frontend JavaScript
3. `FRONTEND_HANDOFF.md` — endpoint request and response reference
4. `http://localhost:8000/docs` — live Swagger UI after starting the API

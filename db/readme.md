# Argonyx Shared Postgres Database

This database is the shared persistence layer for the platform. It contains both:

- the auth tables used by the auth service
- the stat-models / learning-trace tables used by the tutoring and diagnosis flow

The project currently runs against a single Postgres database named `argonyx` on localhost:5433.

---

## 1. Current database layout

### Auth tables
These are owned by the auth service in [auth-service/db/schema.sql](../auth-service/db/schema.sql):

- `users`
  - user identity rows
  - `id`, `email`, `password_hash`, `google_id`, `name`, `avatar_url`, `email_verified`
- `refresh_tokens`
  - rotating refresh-token storage for the auth service

### Learning / stat-models tables
These are created from the migrations in [db/postgres/migrations](./postgres/migrations):

- `students`
- `topics`
- `prerequisite_edges`
- `misconceptions`
- `mcq_questions`
- `mcq_options`
- `mastery_state`
- `attempts`
- `reinject_queue`
- `ide_sessions`
- `consent_preferences`

---

## 2. Shared DB conventions

### Identity keys
The project uses two different identity concepts:

- `users.id` is the auth-service user UUID
- `students.student_id` is the learner identity used by the stat-models flow

These are intentionally separate. The learning layer treats `student_id` as an opaque application ID, while auth owns the credentialed account row.

For a single user, the usual pattern is:

- auth creates/owns the `users` record
- the app also creates or resolves a matching row in `students`
- `student_id` is the join key used across learning features

### Mastery write rule
`mastery_state` is the BKT-owned table. It should be updated only through the mastery engine logic, not written directly by a script or ad hoc query.

### Auth + app in one DB
The auth service and the stat-models feature share the same Postgres DB instance, which is currently configured as:

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/argonyx
```

This is the expected local setup for the workspace right now.

---

## 3. Main learning tables

### `students`
One row per learner. Stores onboarding fields like `target_role` and `timeline_weeks`.

### `topics`
Topic DAG nodes, such as dot-namespaced IDs like `dsa.dp.knapsack`.

Fields include:
- `topic_id`
- `domain`
- `display_name`
- `difficulty`
- `p_init`
- `p_transit`
- `p_slip`
- `p_guess`
- `stability_days_override`

### `prerequisite_edges`
Manual prerequisite graph, used for backward traversal to find the root cause behind a weak topic.

### `misconceptions`
Stable misconception identifiers tied to a topic and an error category.

### `mcq_questions` / `mcq_options`
MCQ content for diagnosis. Wrong options are tagged with a misconception if known.

### `mastery_state`
Per-user, per-topic mastery estimate.

Schema includes:
- `student_id`
- `topic_id`
- `p_mastery`
- `attempts`
- `last_correct_at`
- `last_updated`

### `attempts`
Permanent attempt log for MCQ and code-path diagnoses.

### `reinject_queue`
Topics flagged for reintroduction based on retention decay.

### `ide_sessions`
VS Code companion usage sessions.

### `consent_preferences`
Student-level consent settings for monitoring and diagnostics.

---

## 4. Bootstrapping the database

From the project root:

```powershell
$env:DB_NAME="argonyx"
$env:DB_USER="postgres"
$env:DB_PASSWORD="postgres"
$env:DB_HOST="localhost"
$env:DB_PORT="5433"
$env:PATH += ";C:\Program Files\PostgreSQL\16\bin"

& "C:\Program Files\Git\bin\bash.exe" "./db/postgres/scripts/init_db.sh"
```

This script creates the database if needed and runs all migration files in order.

---

## 5. Auth-service integration

The auth service connects to the same Postgres database via its environment file in [auth-service/.env](../auth-service/.env):

```env
DATABASE_URL=postgresql://postgres:postgres@localhost:5433/argonyx
```

To apply the auth schema:

```powershell
cd auth-service
npm install
npm run migrate
```

That runs [auth-service/db/schema.sql](../auth-service/db/schema.sql) and creates the auth-only tables without duplicating the learning schema.

---

## 6. Operational rules

- Do not write directly to `mastery_state` unless you are intentionally running the BKT update path.
- `student_id` is the shared learning key; keep it consistent between onboarding, diagnosis, and learning features.
- `users` is auth-only and should not be used as the master learner key for stat-model logic.
- Use the project bootstrap for the app schema, and the auth-service migration for auth schema.

---

## 7. Current project state

This repo is now in a shared-DB model:

- one Postgres database: `argonyx`
- one auth service: `auth-service`
- one stat-model / learning schema: the migration files under [db/postgres/migrations](./postgres/migrations)

This is the working structure that matches the current code and service configuration in the workspace.

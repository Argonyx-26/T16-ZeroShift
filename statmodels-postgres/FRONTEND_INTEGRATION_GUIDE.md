# Frontend Integration Guide

This guide explains how the React/Next.js frontend should connect to the Stat Models
FastAPI backend.

## 1. Backend URL

For local development, start the backend from the `statmodels-postgres` directory:

```bash
pip install -r requirements.txt
PYTHONPATH=. uvicorn app.main:app --reload --port 8000
```

Use this API base URL in the frontend:

```javascript
const API_BASE_URL = "http://localhost:8000";
```

The backend API documentation is available at:

```text
http://localhost:8000/docs
http://localhost:8000/redoc
http://localhost:8000/openapi.json
```

## 2. Recommended Frontend API Helper

Create a file such as `src/lib/statModelsApi.js` in the frontend:

```javascript
const API_BASE_URL =
  import.meta.env.VITE_STAT_MODELS_API_URL || "http://localhost:8000";

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
    const error = body.error || {
      code: "HTTP_ERROR",
      message: `Request failed with status ${response.status}`
    };
    throw new Error(`${error.code}: ${error.message}`);
  }

  return body.data;
}

export function diagnoseMcq(payload) {
  return request("/diagnose/mcq", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function diagnoseCode(payload) {
  return request("/diagnose/code", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getMastery(studentId, topicId) {
  const params = new URLSearchParams({
    student_id: studentId,
    topic_id: topicId
  });
  return request(`/bkt/mastery?${params}`);
}

export function runOnboarding(payload) {
  return request("/onboarding/diagnostic", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function traceRootCause(payload) {
  return request("/root-cause/trace", {
    method: "POST",
    body: JSON.stringify(payload)
  });
}

export function getRevisionQueue(studentId) {
  const params = new URLSearchParams({ student_id: studentId });
  return request(`/forgetting-curve/run?${params}`);
}

export function getMisconceptionHistory(studentId, misconceptionId) {
  const params = new URLSearchParams({
    student_id: studentId,
    misconception_id: misconceptionId
  });
  return request(`/misconception-history?${params}`);
}

export function getResources(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  return request(`/resources?${params}`);
}

export function getQuestions(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  return request(`/questions?${params}`);
}

export function getQuestionBatch(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  return request(`/questions/batch?${params}`);
}

export function getStudyMaterials(filters = {}) {
  const params = new URLSearchParams();
  Object.entries(filters).forEach(([key, value]) => {
    if (value !== undefined && value !== null && value !== "") {
      params.set(key, value);
    }
  });
  return request(`/study-materials?${params}`);
}

export function getYoutubeEmbedUrl(url) {
  return request("/youtube/embed", {
    method: "POST",
    body: JSON.stringify({ url })
  });
}
```

For Next.js, replace `import.meta.env.VITE_STAT_MODELS_API_URL` with the project's
public environment-variable convention, such as `process.env.NEXT_PUBLIC_API_URL`.

## 3. Response Handling

Successful backend responses have this shape:

```json
{
  "ok": true,
  "data": {},
  "error": null
}
```

The API helper returns only `data`, so a component can use the result directly.
Backend errors have a code and message. Display a useful message to the learner and
log the code for debugging.

Common codes include:

- `TOPIC_NOT_FOUND`
- `STUDENT_NOT_FOUND`
- `INVALID_YOUTUBE_URL`
- `LLM_TIMEOUT`
- `INSUFFICIENT_DATA`

`INSUFFICIENT_DATA` represents a valid state rather than a normal failure. The UI
should show an explanation such as “More attempts are needed to estimate this topic.”

## 4. MCQ Flow

When a learner selects an answer, call the backend immediately:

```javascript
const result = await diagnoseMcq({
  student_id: studentId,
  question_id: question.id,
  topic_id: question.topic_id,
  selected_option_id: selectedOptionId,
  response_time_ms: elapsedMilliseconds
});

// result.diagnosis contains correctness and misconception information.
// result.mastery contains the updated topic mastery.
setMastery(result.mastery);
setDiagnosis(result.diagnosis);
```

The backend also logs the attempt. The frontend should not write directly to
PostgreSQL.

## 5. Code Submission Flow

After the frontend or code runner has test results and static-analysis results:

```javascript
const result = await diagnoseCode({
  student_id: studentId,
  problem_id: problem.id,
  topic_id: problem.topic_id,
  code: submittedCode,
  language: "python",
  test_results: testResults,
  static_analysis: staticAnalysis
});

setDiagnosis(result.diagnosis);
setMastery(result.mastery);
```

The diagnosis can contain an error type such as `wrong_approach`,
`edge_case_missed`, `complexity_issue`, or `off_by_one`.

## 6. Onboarding Flow

Submit the learner's role, timeline, and diagnostic answers once during onboarding:

```javascript
const plan = await runOnboarding({
  student_id: studentId,
  target_role: "backend",
  timeline_weeks: 12,
  responses: answers.map((answer) => ({
    question_id: answer.questionId,
    selected_option_id: answer.selectedOptionId
  }))
});
```

Use the response like this:

- `per_topic_mastery`: starting mastery cards
- `domain_summary`: strengths and weaknesses by subject
- `recommended_starting_plan`: ordered first topics or lessons
- `per_response`: answer-level explanations

## 7. Resource Recommendation Flow

Load resources for a domain or topic:

```javascript
const resources = await getResources({
  domain: "dsa",
  topic_id: "dsa.dynamic-programming",
  level: "intermediate",
  limit: 10
});

resources.resources.forEach((resource) => {
  console.log(resource.title, resource.url, resource.can_embed);
});
```

A resource object looks like this:

```json
{
  "resource_id": "dsa-dp-gfg",
  "domain": "dsa",
  "topic_id": "dsa.dynamic-programming",
  "title": "Dynamic Programming Tutorial",
  "resource_type": "article",
  "level": "beginner-advanced",
  "duration": null,
  "url": "https://www.geeksforgeeks.org/dsa/dynamic-programming/",
  "can_embed": false
}
```

Use the resource type and `can_embed` value to choose the UI:

- `can_embed: true`: use the YouTube embed flow below.
- `can_embed: false`: show an external link or use an approved internal viewer.

The SQL-backed material endpoint can be filtered by how the frontend should display
the item:

```javascript
const materials = await getStudyMaterials({
  domain: "dsa",
  display_mode: "video",
  limit: 20
});
```

Use `display_mode` as follows:

- `video`: call `/youtube/embed`, then render an iframe.
- `file`: show a document/article card or approved viewer.
- `external_link`: use an anchor with `href={material.url}` to open the original site.

## 8. YouTube Video Flow

For a resource where `can_embed` is true:

```javascript
const result = await getYoutubeEmbedUrl(resource.url);
setEmbedUrl(result.embed_url);
```

Render the returned URL in an iframe:

```jsx
{embedUrl && (
  <iframe
    src={embedUrl}
    title={resource.title}
    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
    allowFullScreen
    style={{ width: "100%", aspectRatio: "16 / 9", border: 0 }}
  />
)}
```

The video remains hosted by YouTube. The application does not download or re-host it.
Some videos may refuse embedding because of the owner's settings.

## 9. Question Selection Flow

Request a randomized batch by difficulty:

```javascript
const quiz = await getQuestions({
  domain: "dsa",
  difficulty: "intermediate",
  count: 10
});
```

Other examples:

```text
GET /questions?domain=dbms&difficulty=easy&count=10
GET /questions?topic_id=dsa.graphs.bfs&difficulty=hard&count=5
```

The response includes question text, options, topic, domain, and difficulty. Submit
the selected option to `/diagnose/mcq` after the learner answers. The current demo
response also contains `correct_option_id`; hide that field in a production quiz UI
until answer submission.

For an exact mixed-difficulty quiz, request counts directly:

```javascript
const quiz = await getQuestionBatch({
  domain: "dsa",
  easy_count: 5,
  intermediate_count: 3,
  hard_count: 2
});
```

Equivalent URL:

```text
GET /questions/batch?domain=dsa&easy_count=5&intermediate_count=3&hard_count=2
```

The response includes `requested`, `returned`, and `shortages`. A shortage means the
SQL bank does not yet contain enough questions at that difficulty for the selected
domain or topic.

## 10. Revision and Root-Cause Screens

For a revision screen:

```javascript
const revision = await getRevisionQueue(studentId);
setRevisionItems(revision);
```

For a “why am I struggling?” screen:

```javascript
const trace = await traceRootCause({
  student_id: studentId,
  failing_topic_id: failingTopicId,
  mastery_threshold: 0.6
});
```

Display the returned prerequisite topic as the recommended foundation to review.

## 11. Environment Configuration

Do not hard-code the production backend URL. Configure it per environment:

```text
Frontend .env.local:
VITE_STAT_MODELS_API_URL=http://localhost:8000
```

For production, replace the value with the deployed HTTPS API URL. Before deployment,
set the backend `FRONTEND_ORIGINS` environment variable to the real frontend origin,
for example `https://app.example.com`. Multiple origins can be comma-separated.

## 12. Integration Checklist

- Start PostgreSQL and apply `db/schema.sql`.
- Seed demo data or use the team's real curriculum data.
- Start the FastAPI backend on port 8000.
- Set the frontend API base URL.
- Open `/docs` and verify the backend is reachable.
- Connect onboarding to `/onboarding/diagnostic`.
- Connect MCQ submission to `/diagnose/mcq`.
- Connect code submission to `/diagnose/code`.
- Render mastery returned by diagnosis calls.
- Add revision items from `/forgetting-curve/run`.
- Load recommendations from `/resources`.
- Embed YouTube resources through `/youtube/embed`.
- Handle `ok: false` and HTTP errors in one shared API helper.
- Restrict CORS and add authentication before production deployment.

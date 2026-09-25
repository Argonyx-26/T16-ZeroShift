from datetime import datetime, timezone
import os
from typing import Optional
from urllib.parse import parse_qs, urlparse
import re
from fastapi import FastAPI, Query, Request
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

from app import bkt, root_cause, forgetting_curve, misconceptions, attempts, onboarding, resources
from app.errors import AppError
from app.db import get_cursor

app = FastAPI(
    title="Adaptive Learning Stat Models API",
    version="1.0.0",
    description=(
        "Backend API for misconception diagnosis, Bayesian Knowledge Tracing, "
        "prerequisite root-cause tracing, forgetting-curve revision, onboarding, "
        "and verified YouTube resource embedding. The frontend should use the "
        "JSON endpoints below; it should not access PostgreSQL directly."
    ),
    openapi_tags=[
        {"name": "System", "description": "API availability and service metadata."},
        {"name": "Diagnosis", "description": "Analyze MCQ and code attempts."},
        {"name": "Mastery", "description": "Read and update Bayesian Knowledge Tracing state."},
        {"name": "Onboarding", "description": "Assess a new learner and create a starting plan."},
        {"name": "Root Cause", "description": "Trace a weak topic to prerequisite gaps."},
        {"name": "Revision", "description": "Find topics due for forgetting-curve revision."},
        {"name": "History", "description": "Read misconception frequency and recency."},
        {"name": "Resources", "description": "Prepare supported learning resources for in-site display."},
    ],
)

configured_origins = os.environ.get("FRONTEND_ORIGINS", "*")
allowed_origins = [origin.strip() for origin in configured_origins.split(",") if origin.strip()]

app.add_middleware(
    CORSMiddleware,
    allow_origins=allowed_origins,
    allow_credentials=False,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Optional JWT auth — off by default (REQUIRE_AUTH=false).
# When enabled, validates Bearer tokens issued by the auth-service.
from app.auth import JWTAuthMiddleware  # noqa: E402
app.add_middleware(JWTAuthMiddleware)


def envelope(data):
    return {"ok": True, "data": data, "error": None}


@app.exception_handler(AppError)
async def app_error_handler(request: Request, exc: AppError):
    return JSONResponse(
        status_code=exc.status_code,
        content={"ok": False, "data": None, "error": exc.to_dict()},
    )


# ---------- schemas ----------

class MCQDiagnoseReq(BaseModel):
    """One MCQ answer submitted by a learner."""

    student_id: str
    question_id: str
    topic_id: str
    selected_option_id: str
    correct_option_id: Optional[str] = None
    response_time_ms: Optional[int] = None


class CodeDiagnoseReq(BaseModel):
    """One code submission with already-computed test and static-analysis results."""

    student_id: str
    problem_id: str
    topic_id: str
    code: str
    language: str = "python"
    test_results: list[dict]
    static_analysis: dict = {}


class BKTUpdateReq(BaseModel):
    """A direct mastery event for a learning interaction outside diagnosis."""

    student_id: str
    topic_id: str
    is_correct: bool


class RootCauseReq(BaseModel):
    """A topic whose prerequisite graph should be traced."""

    student_id: str
    failing_topic_id: str
    mastery_threshold: float = 0.6


class OnboardingResponse(BaseModel):
    question_id: str
    selected_option_id: str


class OnboardingReq(BaseModel):
    """A learner's initial diagnostic batch."""

    student_id: str
    target_role: Optional[str] = None
    timeline_weeks: Optional[int] = None
    responses: list[OnboardingResponse]


class YouTubeEmbedReq(BaseModel):
    """A supported YouTube URL to convert into an iframe URL."""

    url: str


class ResourceListResponse(BaseModel):
    """Resource catalog response returned to the frontend."""

    resources: list[dict]
    count: int


def youtube_embed_url(url: str) -> str:
    """Convert a YouTube watch/share URL into a privacy-enhanced embed URL."""
    parsed = urlparse(url.strip())
    hostname = parsed.hostname.lower() if parsed.hostname else ""
    video_id = ""

    if hostname in {"youtube.com", "www.youtube.com", "m.youtube.com"}:
        if parsed.path == "/watch":
            video_id = parse_qs(parsed.query).get("v", [""])[0]
        elif parsed.path.startswith("/shorts/") or parsed.path.startswith("/embed/"):
            video_id = parsed.path.split("/")[2]
    elif hostname in {"youtu.be", "www.youtu.be"}:
        video_id = parsed.path.lstrip("/").split("/")[0]

    if not re.fullmatch(r"[A-Za-z0-9_-]{11}", video_id):
        raise ValueError("url must be a valid YouTube video URL")

    return f"https://www.youtube-nocookie.com/embed/{video_id}"


# ---------- endpoints ----------

@app.post(
    "/diagnose/mcq",
    tags=["Diagnosis"],
    summary="Diagnose an MCQ answer",
    description="Diagnoses the selected option, updates topic mastery, and logs the attempt.",
)
def diagnose_mcq_ep(req: MCQDiagnoseReq):
    diag = misconceptions.diagnose_mcq(req.student_id, req.question_id, req.selected_option_id)
    bkt_result = bkt.update_mastery(req.student_id, diag["topic_id"], diag["is_correct"])
    attempts.log_attempt(req.student_id, diag["topic_id"], "mcq", req.question_id, diag, bkt_result)
    return envelope({"diagnosis": diag, "mastery": bkt_result})


@app.post(
    "/diagnose/code",
    tags=["Diagnosis"],
    summary="Diagnose a code submission",
    description="Classifies likely code errors, updates topic mastery, and logs the attempt.",
)
def diagnose_code_ep(req: CodeDiagnoseReq):
    diag = misconceptions.diagnose_code(
        req.student_id, req.problem_id, req.topic_id, req.code, req.test_results, req.static_analysis
    )
    bkt_result = bkt.update_mastery(req.student_id, req.topic_id, diag["is_correct"])
    attempts.log_attempt(req.student_id, req.topic_id, "code", req.problem_id, diag, bkt_result)
    return envelope({"diagnosis": diag, "mastery": bkt_result})


@app.post(
    "/bkt/update",
    tags=["Mastery"],
    summary="Update topic mastery",
    description="Applies one correct or incorrect learning event to BKT mastery.",
)
def bkt_update_ep(req: BKTUpdateReq):
    return envelope(bkt.update_mastery(req.student_id, req.topic_id, req.is_correct))


@app.get(
    "/bkt/mastery",
    tags=["Mastery"],
    summary="Read topic mastery",
    description="Returns the current BKT mastery state for one learner and topic.",
)
def bkt_get_ep(
    student_id: str = Query(..., description="Learner identifier", examples=["student-1"]),
    topic_id: str = Query(..., description="Topic identifier", examples=["arrays"]),
):
    result = bkt.get_mastery(student_id, topic_id)
    return envelope(result)


@app.post(
    "/onboarding/diagnostic",
    tags=["Onboarding"],
    summary="Run the onboarding diagnostic",
    description="Assesses initial answers and returns mastery summaries plus a starting plan.",
)
def onboarding_diagnostic_ep(req: OnboardingReq):
    result = onboarding.run_diagnostic(
        req.student_id,
        req.target_role,
        req.timeline_weeks,
        [r.model_dump() for r in req.responses],
    )
    return envelope(result)


@app.post(
    "/youtube/embed",
    tags=["Resources"],
    summary="Convert a YouTube URL for in-site playback",
    description="Validates a YouTube URL and returns a youtube-nocookie.com iframe URL.",
    responses={422: {"description": "The URL is not a supported YouTube video URL."}},
)
def youtube_embed_ep(req: YouTubeEmbedReq):
    try:
        embed_url = youtube_embed_url(req.url)
    except ValueError as exc:
        return JSONResponse(
            status_code=422,
            content={"ok": False, "data": None, "error": {"code": "INVALID_YOUTUBE_URL", "message": str(exc)}},
        )
    return envelope({"embed_url": embed_url})


@app.get(
    "/resources",
    tags=["Resources"],
    summary="List learning resources",
    description=(
        "Returns curated resources filtered by domain, topic, level, or type. "
        "Use can_embed to decide whether to render a resource in-site or open it externally."
    ),
    response_model=dict,
)
def resources_ep(
    domain: str | None = Query(None, description="dsa, dbms, system_design, or web_dev"),
    topic_id: str | None = Query(None, description="Topic key such as dsa.dynamic-programming"),
    level: str | None = Query(None, description="beginner, intermediate, or advanced"),
    resource_type: str | None = Query(None, description="video, article, practice, course, or roadmap"),
    limit: int = Query(20, ge=1, le=100, description="Maximum number of resources to return"),
):
    with get_cursor() as cur:
        clauses = ["is_active = true"]
        params = []
        if domain:
            clauses.append("domain = %s")
            params.append(domain)
        if topic_id:
            clauses.append("topic_id = %s")
            params.append(topic_id)
        if level:
            clauses.append("level ILIKE %s")
            params.append(f"%{level}%")
        if resource_type:
            clauses.append("material_type = %s")
            params.append(resource_type)
        params.append(limit)
        cur.execute(
            f"""SELECT material_id AS resource_id, domain, topic_id, title,
                       material_type AS resource_type, display_mode, level, duration,
                       url, can_embed
                FROM study_materials
                WHERE {' AND '.join(clauses)}
                ORDER BY material_id
                LIMIT %s""",
            params,
        )
        result = cur.fetchall()
    return envelope({"resources": result, "count": len(result)})


@app.get(
    "/study-materials",
    tags=["Resources"],
    summary="List SQL-backed study materials",
    description=(
        "Returns videos, documents, articles, courses, and external links from "
        "the study_materials table. display_mode tells the frontend how to render each item."
    ),
)
def study_materials_ep(
    domain: str | None = Query(None, description="dsa, dbms, system_design, or web_dev"),
    topic_id: str | None = Query(None, description="Topic key"),
    material_type: str | None = Query(None, description="video, document, article, practice, or course"),
    display_mode: str | None = Query(None, description="video, file, or external_link"),
    limit: int = Query(50, ge=1, le=200),
):
    with get_cursor() as cur:
        clauses = ["is_active = true"]
        params = []
        for column, value in (("domain", domain), ("topic_id", topic_id),
                              ("material_type", material_type), ("display_mode", display_mode)):
            if value:
                clauses.append(f"{column} = %s")
                params.append(value)
        params.append(limit)
        cur.execute(
            f"""SELECT material_id, domain, topic_id, title, material_type,
                       display_mode, level, duration, url, can_embed
                FROM study_materials
                WHERE {' AND '.join(clauses)}
                ORDER BY domain, topic_id, material_id
                LIMIT %s""",
            params,
        )
        result = cur.fetchall()
    return envelope({"materials": result, "count": len(result)})


@app.get(
    "/questions",
    tags=["Diagnosis"],
    summary="Get a randomized MCQ batch",
    description=(
        "Returns up to count questions filtered by domain, topic, and difficulty. "
        "The correct answer is included for the demo contract; production quiz UIs "
        "should avoid exposing it before submission."
    ),
)
def questions_ep(
    domain: str | None = Query(None, description="dsa, dbms, system_design, or web_dev"),
    topic_id: str | None = Query(None, description="Topic key"),
    difficulty: str | None = Query(None, description="easy, intermediate, or hard"),
    count: int = Query(10, ge=1, le=60, description="Number of MCQs requested"),
):
    with get_cursor() as cur:
        clauses = ["TRUE"]
        params = []
        if domain:
            clauses.append("t.domain = %s")
            params.append(domain)
        if topic_id:
            clauses.append("q.topic_id = %s")
            params.append(topic_id)
        if difficulty:
            clauses.append("q.difficulty = %s")
            params.append(difficulty)
        params.append(count)
        cur.execute(
            f"""SELECT q.question_id, q.topic_id, t.domain, q.prompt, q.difficulty,
                       q.correct_option_id,
                       COALESCE(json_agg(json_build_object(
                         'option_id', o.option_id,
                         'option_text', o.option_text
                       ) ORDER BY o.option_id) FILTER (WHERE o.option_id IS NOT NULL), '[]') AS options
                FROM mcq_questions q
                JOIN topics t ON t.topic_id = q.topic_id
                LEFT JOIN mcq_options o ON o.question_id = q.question_id
                WHERE {' AND '.join(clauses)}
                GROUP BY q.question_id, t.domain
                ORDER BY random()
                LIMIT %s""",
            params,
        )
        result = cur.fetchall()
    return envelope({"questions": result, "count": len(result)})


@app.get(
    "/questions/batch",
    tags=["Diagnosis"],
    summary="Build a mixed-difficulty MCQ batch",
    description=(
        "Returns exactly the requested number of easy, intermediate, and hard questions "
        "when enough questions exist in the filtered SQL bank."
    ),
)
def questions_batch_ep(
    domain: str | None = Query(None, description="dsa, dbms, system_design, or web_dev"),
    topic_id: str | None = Query(None, description="Topic key"),
    easy_count: int = Query(0, ge=0, le=60),
    intermediate_count: int = Query(0, ge=0, le=60),
    hard_count: int = Query(0, ge=0, le=60),
):
    counts = {
        "easy": easy_count,
        "intermediate": intermediate_count,
        "hard": hard_count,
    }
    if sum(counts.values()) == 0:
        return JSONResponse(
            status_code=422,
            content={
                "ok": False,
                "data": None,
                "error": {"code": "EMPTY_QUIZ_REQUEST", "message": "Request at least one question."},
            },
        )

    with get_cursor() as cur:
        clauses = ["t.domain = %s"] if domain else ["TRUE"]
        base_params = [domain] if domain else []
        if topic_id:
            clauses.append("q.topic_id = %s")
            base_params.append(topic_id)
        groups = {}
        for difficulty, requested in counts.items():
            if requested == 0:
                groups[difficulty] = []
                continue
            cur.execute(
                f"""SELECT q.question_id, q.topic_id, t.domain, q.prompt, q.difficulty,
                           q.correct_option_id,
                           COALESCE(json_agg(json_build_object(
                             'option_id', o.option_id, 'option_text', o.option_text
                           ) ORDER BY o.option_id) FILTER (WHERE o.option_id IS NOT NULL), '[]') AS options
                    FROM mcq_questions q
                    JOIN topics t ON t.topic_id = q.topic_id
                    LEFT JOIN mcq_options o ON o.question_id = q.question_id
                    WHERE {' AND '.join(clauses)} AND q.difficulty = %s
                    GROUP BY q.question_id, t.domain
                    ORDER BY random()
                    LIMIT %s""",
                [*base_params, difficulty, requested],
            )
            groups[difficulty] = cur.fetchall()

    selected = groups["easy"] + groups["intermediate"] + groups["hard"]
    shortages = {
        difficulty: counts[difficulty] - len(groups[difficulty])
        for difficulty in counts
        if len(groups[difficulty]) < counts[difficulty]
    }
    return envelope({
        "questions": selected,
        "count": len(selected),
        "requested": counts,
        "returned": {difficulty: len(groups[difficulty]) for difficulty in counts},
        "shortages": shortages,
    })


@app.post(
    "/root-cause/trace",
    tags=["Root Cause"],
    summary="Trace a topic's prerequisite root cause",
    description="Finds the deepest unmastered prerequisite of a failing topic.",
)
def root_cause_ep(req: RootCauseReq):
    return envelope(root_cause.trace_root_cause(req.student_id, req.failing_topic_id, req.mastery_threshold))


@app.get(
    "/forgetting-curve/run",
    tags=["Revision"],
    summary="Find topics due for revision",
    description="Runs the forgetting-curve batch and returns topics needing a refresher.",
)
def forgetting_curve_ep(
    student_id: str = Query(..., description="Learner identifier", examples=["student-1"]),
):
    return envelope(forgetting_curve.run_forgetting_curve_batch(student_id))


@app.get(
    "/misconception-history",
    tags=["History"],
    summary="Read misconception history",
    description="Returns total and recent occurrences of a misconception for a learner.",
)
def misconception_history_ep(
    student_id: str = Query(..., description="Learner identifier", examples=["student-1"]),
    misconception_id: str = Query(..., description="Misconception identifier", examples=["off-by-one"]),
):
    with get_cursor() as cur:
        cur.execute(
            "SELECT COUNT(*) AS total FROM attempts WHERE student_id=%s AND misconception_id=%s",
            (student_id, misconception_id),
        )
        total = cur.fetchone()["total"]
        # last 4 attempts on this misconception's topic, then count how many of THOSE
        # were actually this misconception (bug fix: previous version counted the last
        # 4 topic attempts unconditionally, never checking if they matched misconception_id)
        cur.execute(
            """
            SELECT COUNT(*) FILTER (WHERE misconception_id = %s) AS recent_count,
                   COUNT(*) AS recent_total
            FROM (
                SELECT misconception_id FROM attempts
                WHERE student_id=%s AND topic_id = (SELECT topic_id FROM misconceptions WHERE misconception_id=%s)
                ORDER BY created_at DESC LIMIT 4
            ) recent_attempts
            """,
            (misconception_id, student_id, misconception_id),
        )
        recent = cur.fetchone()
    return envelope({
        "student_id": student_id,
        "misconception_id": misconception_id,
        "total_occurrences": total,
        "occurrences_in_last_4_topic_attempts": recent["recent_count"] if recent else 0,
        "attempts_considered": recent["recent_total"] if recent else 0,
    })


@app.get(
    "/topics",
    tags=["Mastery"],
    summary="List all curriculum topics",
    description="Returns every topic in the curriculum with its domain, display name, difficulty, and BKT parameters.",
)
def topics_ep(
    domain: str | None = Query(None, description="Filter by domain: dsa, dbms, system_design, web_dev"),
):
    with get_cursor() as cur:
        if domain:
            cur.execute(
                """SELECT topic_id, domain, display_name, difficulty,
                          p_init, p_transit, p_slip, p_guess
                   FROM topics WHERE domain = %s ORDER BY topic_id""",
                (domain,),
            )
        else:
            cur.execute(
                """SELECT topic_id, domain, display_name, difficulty,
                          p_init, p_transit, p_slip, p_guess
                   FROM topics ORDER BY domain, topic_id"""
            )
        rows = cur.fetchall()
    return envelope({"topics": rows, "count": len(rows)})


@app.get(
    "/bkt/mastery-all",
    tags=["Mastery"],
    summary="Read all mastery records for a student",
    description=(
        "Returns every topic's BKT mastery state for the given student. "
        "Topics the student has never attempted are included with p_mastery = p_init."
    ),
)
def bkt_mastery_all_ep(
    student_id: str = Query(..., description="Learner identifier"),
):
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM students WHERE student_id = %s", (student_id,))
        if cur.fetchone() is None:
            return envelope({"mastery": [], "count": 0})

        cur.execute(
            """SELECT t.topic_id, t.domain, t.display_name, t.difficulty,
                      COALESCE(ms.p_mastery, t.p_init) AS p_mastery,
                      COALESCE(ms.attempts, 0) AS attempts,
                      ms.last_correct_at, ms.last_updated
               FROM topics t
               LEFT JOIN mastery_state ms
                 ON ms.topic_id = t.topic_id AND ms.student_id = %s
               ORDER BY t.domain, t.topic_id""",
            (student_id,),
        )
        rows = cur.fetchall()
        # Serialise datetimes
        for r in rows:
            if r.get("last_correct_at"):
                r["last_correct_at"] = r["last_correct_at"].isoformat()
            if r.get("last_updated"):
                r["last_updated"] = r["last_updated"].isoformat()
    return envelope({"mastery": rows, "count": len(rows)})


@app.get(
    "/attempts",
    tags=["History"],
    summary="Read attempt history for a student",
    description="Returns recent attempts for a student, optionally filtered by topic.",
)
def attempts_ep(
    student_id: str = Query(..., description="Learner identifier"),
    topic_id: str | None = Query(None, description="Filter by topic"),
    limit: int = Query(50, ge=1, le=200),
):
    with get_cursor() as cur:
        clauses = ["student_id = %s"]
        params = [student_id]
        if topic_id:
            clauses.append("topic_id = %s")
            params.append(topic_id)
        params.append(limit)
        cur.execute(
            f"""SELECT attempt_id AS id, student_id, topic_id, source, question_id,
                       is_correct, misconception_id, confidence, p_mastery_before,
                       p_mastery_after, created_at
                FROM attempts
                WHERE {' AND '.join(clauses)}
                ORDER BY created_at DESC
                LIMIT %s""",
            params,
        )
        rows = cur.fetchall()
        for r in rows:
            if r.get("created_at"):
                r["created_at"] = r["created_at"].isoformat()
    return envelope({"attempts": rows, "count": len(rows)})


@app.get(
    "/health",
    tags=["System"],
    summary="Check API health",
    description="Returns success when the API process is available.",
)
def health():
    return {"ok": True}

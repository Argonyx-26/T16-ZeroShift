"""
Personalized onboarding (doc section 5.6). Runs a per-subject diagnostic quiz
through the SAME diagnosis + BKT pipeline as normal practice (no separate
math, no separate write path — onboarding is just the first N attempts,
which is why `mastery_state`/`attempts` end up correct for free afterwards).

What this adds on top of diagn+bkt: it (1) creates the student row so the
signup flow has one call to do that, (2) runs a whole batch of diagnostic
answers in one request instead of one HTTP round trip per question, and
(3) turns the resulting per-topic mastery into a starting plan the frontend
can render directly, instead of leaving that aggregation to the client.

Starting-plan algorithm (documented, not hidden): take every topic the
student was quizzed on, sort ascending by resulting p_mastery (weakest
first), then walk that sorted list picking at most one topic per domain
per pass, cycling through domains, until every domain has contributed or
the list is exhausted. This guarantees week 1 isn't "all DSA" for someone
who bombed DSA and skipped DBMS — every weak domain gets represented early,
without hand-tuning per-domain weights we have no data to justify yet.
"""
from app.db import get_cursor
from app import bkt, misconceptions, attempts as attempts_module
from app.errors import TopicNotFound


def _ensure_student(student_id: str, target_role: str | None, timeline_weeks: int | None) -> None:
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO students (student_id, target_role, timeline_weeks)
            VALUES (%s, %s, %s)
            ON CONFLICT (student_id) DO UPDATE SET
                target_role = COALESCE(EXCLUDED.target_role, students.target_role),
                timeline_weeks = COALESCE(EXCLUDED.timeline_weeks, students.timeline_weeks)
            """,
            (student_id, target_role, timeline_weeks),
        )


def _topic_domain_map(cur, topic_ids: list[str]) -> dict[str, str]:
    if not topic_ids:
        return {}
    cur.execute("SELECT topic_id, domain FROM topics WHERE topic_id = ANY(%s)", (topic_ids,))
    return {r["topic_id"]: r["domain"] for r in cur.fetchall()}


def _build_starting_plan(per_topic: list[dict]) -> list[str]:
    # bucket by domain, each bucket sorted weakest-first
    by_domain: dict[str, list[dict]] = {}
    for t in per_topic:
        by_domain.setdefault(t["domain"], []).append(t)
    for d in by_domain:
        by_domain[d].sort(key=lambda t: t["p_mastery"])

    plan: list[str] = []
    domains = list(by_domain.keys())
    idx = 0
    while any(by_domain[d] for d in domains):
        d = domains[idx % len(domains)]
        if by_domain[d]:
            plan.append(by_domain[d].pop(0)["topic_id"])
        idx += 1
    return plan


def _validate_responses(responses: list[dict]) -> None:
    """
    Each diagnose_mcq/bkt.update_mastery call commits independently (they're
    not one DB transaction), so a bad question_id/option_id partway through
    a multi-question onboarding batch would otherwise leave the earlier
    questions' BKT updates applied while the request as a whole errors out —
    silent partial-write on retry (mastery double-counted). Validate every
    question_id/option_id up front so a bad entry fails the whole batch
    before anything is written, not partway through it.
    """
    if not responses:
        raise TopicNotFound("responses must be a non-empty list")
    with get_cursor() as cur:
        for r in responses:
            cur.execute(
                "SELECT 1 FROM mcq_options WHERE question_id=%s AND option_id=%s",
                (r["question_id"], r["selected_option_id"]),
            )
            if cur.fetchone() is None:
                raise TopicNotFound(
                    f"question_id {r['question_id']} / option {r['selected_option_id']} not found "
                    f"(validated before any writes — no partial batch applied)"
                )


def run_diagnostic(
    student_id: str,
    target_role: str | None,
    timeline_weeks: int | None,
    responses: list[dict],
) -> dict:
    """
    responses: [{"question_id": ..., "selected_option_id": ...}, ...]
    Each is diagnosed + fed through BKT + logged exactly like a normal MCQ
    attempt (source='mcq'), so nothing downstream needs to know these
    attempts happened during onboarding rather than regular practice.
    """
    _validate_responses(responses)
    _ensure_student(student_id, target_role, timeline_weeks)

    touched_topics: dict[str, dict] = {}  # topic_id -> latest bkt_result
    per_response = []

    for r in responses:
        diag = misconceptions.diagnose_mcq(student_id, r["question_id"], r["selected_option_id"])
        bkt_result = bkt.update_mastery(student_id, diag["topic_id"], diag["is_correct"])
        attempts_module.log_attempt(student_id, diag["topic_id"], "mcq", r["question_id"], diag, bkt_result)
        touched_topics[diag["topic_id"]] = bkt_result
        per_response.append({"question_id": r["question_id"], "diagnosis": diag, "mastery": bkt_result})

    with get_cursor() as cur:
        domain_map = _topic_domain_map(cur, list(touched_topics.keys()))

    per_topic = [
        {
            "topic_id": topic_id,
            "domain": domain_map.get(topic_id, "unknown"),
            "p_mastery": res["p_mastery"],
            "mastered": res["mastered"],
        }
        for topic_id, res in touched_topics.items()
    ]

    domain_summary: dict[str, dict] = {}
    for t in per_topic:
        d = domain_summary.setdefault(t["domain"], {"domain": t["domain"], "topics": [], "mastery_sum": 0.0})
        d["topics"].append(t["topic_id"])
        d["mastery_sum"] += t["p_mastery"]
    domain_summary_out = [
        {
            "domain": d["domain"],
            "avg_mastery": round(d["mastery_sum"] / len(d["topics"]), 4),
            "topics_assessed": d["topics"],
        }
        for d in domain_summary.values()
    ]

    return {
        "student_id": student_id,
        "target_role": target_role,
        "timeline_weeks": timeline_weeks,
        "per_response": per_response,
        "per_topic_mastery": per_topic,
        "domain_summary": domain_summary_out,
        "recommended_starting_plan": _build_starting_plan(per_topic),
    }

"""
Standard 4-parameter Bayesian Knowledge Tracing.

P(L_t | evidence) is the filtered posterior given this observation;
P(L_t) folds in the transit probability and is what we persist + expose
as `p_mastery` — it's the forward-looking estimate ("mastery after this
attempt, accounting for the chance they now understand it"), which is
the right quantity to threshold on for "mastered" and to feed into the
root-cause tracer and forgetting-curve model downstream.
"""
from dataclasses import dataclass
from datetime import datetime, timezone
from app.db import get_cursor
from app.errors import TopicNotFound, StudentNotFound


@dataclass
class BKTParams:
    p_init: float
    p_transit: float
    p_slip: float
    p_guess: float


def _clamp(x: float, lo: float = 1e-4, hi: float = 1 - 1e-4) -> float:
    return max(lo, min(hi, x))


def bkt_update(p_prior: float, is_correct: bool, params: BKTParams) -> float:
    p_prior = _clamp(p_prior)
    if is_correct:
        num = p_prior * (1 - params.p_slip)
        denom = num + (1 - p_prior) * params.p_guess
    else:
        num = p_prior * params.p_slip
        denom = num + (1 - p_prior) * (1 - params.p_guess)
    p_posterior = num / denom if denom > 0 else p_prior
    p_next = p_posterior + (1 - p_posterior) * params.p_transit
    return round(_clamp(p_next, 0.0, 1.0), 4)


def get_topic_params(cur, topic_id: str) -> BKTParams:
    cur.execute(
        "SELECT p_init, p_transit, p_slip, p_guess FROM topics WHERE topic_id = %s",
        (topic_id,),
    )
    row = cur.fetchone()
    if row is None:
        raise TopicNotFound(f"topic_id {topic_id} not found")
    return BKTParams(
        p_init=float(row["p_init"]) if row["p_init"] is not None else 0.25,
        p_transit=float(row["p_transit"]) if row["p_transit"] is not None else 0.1,
        p_slip=float(row["p_slip"]) if row["p_slip"] is not None else 0.1,
        p_guess=float(row["p_guess"]) if row["p_guess"] is not None else 0.2,
    )


def update_mastery(
    student_id: str,
    topic_id: str,
    is_correct: bool,
    mastered_threshold: float = 0.85,
    override_params: BKTParams | None = None,
) -> dict:
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM students WHERE student_id = %s", (student_id,))
        if cur.fetchone() is None:
            cur.execute("INSERT INTO students (student_id) VALUES (%s) ON CONFLICT (student_id) DO NOTHING", (student_id,))

        params = override_params or get_topic_params(cur, topic_id)

        cur.execute(
            "SELECT p_mastery, attempts FROM mastery_state WHERE student_id=%s AND topic_id=%s",
            (student_id, topic_id),
        )
        row = cur.fetchone()
        if row is None:
            p_prior = params.p_init
            attempts_prev = 0
        else:
            p_prior = float(row["p_mastery"])
            attempts_prev = row["attempts"]

        p_next = bkt_update(p_prior, is_correct, params)
        now = datetime.now(timezone.utc)

        cur.execute(
            """
            INSERT INTO mastery_state (student_id, topic_id, p_mastery, attempts, last_correct_at, last_updated)
            VALUES (%s, %s, %s, %s, %s, %s)
            ON CONFLICT (student_id, topic_id) DO UPDATE SET
                p_mastery = EXCLUDED.p_mastery,
                attempts = EXCLUDED.attempts,
                last_correct_at = COALESCE(EXCLUDED.last_correct_at, mastery_state.last_correct_at),
                last_updated = EXCLUDED.last_updated
            """,
            (
                student_id,
                topic_id,
                p_next,
                attempts_prev + 1,
                now if is_correct else None,
                now,
            ),
        )

        return {
            "student_id": student_id,
            "topic_id": topic_id,
            "p_mastery_prev": round(p_prior, 4),
            "p_mastery": p_next,
            "mastered": p_next >= mastered_threshold,
            "attempts": attempts_prev + 1,
        }


def get_mastery(student_id: str, topic_id: str) -> dict | None:
    with get_cursor() as cur:
        cur.execute(
            "SELECT p_mastery, attempts, last_updated FROM mastery_state WHERE student_id=%s AND topic_id=%s",
            (student_id, topic_id),
        )
        row = cur.fetchone()
        if row is None:
            return None
        return {
            "topic_id": topic_id,
            "p_mastery": float(row["p_mastery"]),
            "attempts": row["attempts"],
            "last_updated": row["last_updated"].isoformat(),
        }

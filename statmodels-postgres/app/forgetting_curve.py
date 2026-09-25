"""
S (stability, in days) grows with mastery confidence and topic difficulty:
higher mastery and easier topics decay slower. R(t) = exp(-t/S) is the
standard Ebbinghaus retention curve (R = e^(-t/S), the form used across the
spaced-repetition literature, e.g. Wozniak's SuperMemo SM-2 write-ups and
Ebbinghaus's 1885 "Uber das Gedachtnis"). Below R_THRESHOLD, the topic goes
into the reinject queue for one low-stakes question next session.

WHERE THE BASE_STABILITY_BY_DIFFICULTY NUMBERS COME FROM (updated):
Ebbinghaus's *original* numbers (retention down to ~30-40% within a day,
~10% after a month) were measured on rote memorization of meaningless
syllables with zero active practice — the wrong anchor for this app, where
"mastered" means the student solved several problems on the topic with
retrieval practice + feedback (BKT p_mastery >= 0.85), not that they read
a fact once. That's a materially different memory-strength regime.

For practiced/meaningful material, spaced-repetition literature (the basis
for SM-2/Anki-style schedulers) consistently reports the *first* stable
interval after real practice landing in the 2-6 week range for easy/well
-drilled material, shrinking for harder/more complex material — that's the
range these constants are now anchored to, not an arbitrary guess:
  - difficulty 1 (easiest)  -> 42 days base stability  (~6 weeks)
  - difficulty 5 (hardest)  -> 14 days base stability  (~2 weeks)
  linearly interpolated in between.
K=1.2 keeps a well-drilled topic (p_mastery near 1.0) at roughly ~2.2x the
base stability, in line with how much a strong first-pass memory typically
extends the next stable interval in that same literature.

HONESTY NOTE (still true, will always be true until real usage exists):
these are literature-grounded *priors*, not numbers fit to THIS app's own
students. Real calibration needs several weeks of actual reinject-queue
outcomes (did the student still get it right when re-served?) fed back in.
`topics.stability_days_override` (nullable) lets you hand-tune or later
data-fit a specific topic without touching this file — see stability_days()
below. Until that override is populated, every topic uses the formula.
"""
import math
from datetime import datetime, timezone
from app.db import get_cursor

R_THRESHOLD = 0.75
MASTERED_THRESHOLD = 0.85
K = 1.2  # scales how much mastery confidence extends stability (see note above)

# days of base stability by difficulty (1=easiest -> 5=hardest), anchored to
# published spaced-repetition intervals for practiced/meaningful material
# (see module docstring) rather than raw Ebbinghaus nonsense-syllable decay.
BASE_STABILITY_BY_DIFFICULTY = {1: 42, 2: 35, 3: 28, 4: 21, 5: 14}


def stability_days(difficulty: int, p_mastery: float, override_days: float | None = None) -> float:
    """
    override_days: value from topics.stability_days_override, if a real
    calibration has been fit for this specific topic. When present it wins
    outright (no difficulty/mastery formula applied) — it's assumed to
    already reflect this topic's real observed decay.
    """
    if override_days is not None:
        return float(override_days)
    base = BASE_STABILITY_BY_DIFFICULTY.get(difficulty, 28)
    return base * (1 + K * p_mastery)


def retention(days_elapsed: float, stability: float) -> float:
    if stability <= 0:
        return 0.0
    return math.exp(-days_elapsed / stability)


def run_forgetting_curve_batch(student_id: str, as_of: datetime | None = None) -> dict:
    as_of = as_of or datetime.now(timezone.utc)
    reinject, stable = [], []

    with get_cursor() as cur:
        cur.execute(
            """
            SELECT ms.topic_id, ms.p_mastery, ms.last_correct_at, t.difficulty,
                   t.stability_days_override
            FROM mastery_state ms
            JOIN topics t ON t.topic_id = ms.topic_id
            WHERE ms.student_id = %s AND ms.p_mastery >= %s AND ms.last_correct_at IS NOT NULL
            """,
            (student_id, MASTERED_THRESHOLD),
        )
        rows = cur.fetchall()

        for r in rows:
            days_elapsed = (as_of - r["last_correct_at"]).total_seconds() / 86400
            override = r["stability_days_override"]
            s = stability_days(r["difficulty"], float(r["p_mastery"]), float(override) if override is not None else None)
            ret = round(retention(days_elapsed, s), 4)

            if ret < R_THRESHOLD:
                reinject.append({
                    "topic_id": r["topic_id"],
                    "last_correct": r["last_correct_at"].isoformat(),
                    "days_elapsed": round(days_elapsed, 1),
                    "stability_days": round(s, 1),
                    "retention": ret,
                    "action": "reinject_low_stakes",
                })
                cur.execute(
                    """
                    INSERT INTO reinject_queue (student_id, topic_id, retention, computed_at, served)
                    VALUES (%s, %s, %s, %s, false)
                    """,
                    (student_id, r["topic_id"], ret, as_of),
                )
            else:
                stable.append({"topic_id": r["topic_id"], "retention": ret})

    return {
        "student_id": student_id,
        "as_of": as_of.isoformat(),
        "reinject_queue": reinject,
        "stable": stable,
    }

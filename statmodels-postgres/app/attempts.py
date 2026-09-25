"""
Single place that writes the `attempts` table. Both diagnose endpoints call
this after computing diagnosis + BKT update, so the frontend never has to
touch the DB directly and every attempt is guaranteed to be logged
consistently (previously this only happened in scripts/demo_trace.py by
hand — that gap is closed here).
"""
from app.db import get_cursor


def log_attempt(
    student_id: str,
    topic_id: str,
    source: str,  # 'mcq' | 'code'
    question_id: str | None,
    diag: dict,
    bkt_result: dict,
) -> None:
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO attempts (student_id, topic_id, source, question_id, is_correct,
                                   misconception_id, confidence, evidence, p_mastery_before, p_mastery_after)
            VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
            """,
            (
                student_id, topic_id, source, question_id, diag["is_correct"],
                diag["misconception_id"], diag["confidence"], diag["evidence"],
                bkt_result["p_mastery_prev"], bkt_result["p_mastery"],
            ),
        )

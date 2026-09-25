"""
Simulates: student fails an LIS (DP) problem on an empty-array edge case,
three times in a row (plus one earlier pass), then we run the full pipeline:
diagnosis -> BKT update -> root-cause trace -> forgetting-curve check ->
compose the narrative string exactly like the doc's UX example.

Run: PYTHONPATH=. python3 scripts/demo_trace.py
"""
from datetime import datetime, timedelta, timezone
from app.db import get_cursor
from app import misconceptions, bkt, root_cause, forgetting_curve

STUDENT = "s_1029"
TOPIC = "dsa.dp.lis"


def log_attempt(diag: dict, bkt_result: dict):
    with get_cursor() as cur:
        cur.execute(
            """
            INSERT INTO attempts (student_id, topic_id, source, question_id, is_correct,
                                   misconception_id, confidence, evidence, p_mastery_before, p_mastery_after)
            VALUES (%s,%s,'code',%s,%s,%s,%s,%s,%s,%s)
            """,
            (STUDENT, TOPIC, None, diag["is_correct"], diag["misconception_id"],
             diag["confidence"], diag["evidence"], bkt_result["p_mastery_prev"], bkt_result["p_mastery"]),
        )


def submit_code(passed_empty_input: bool):
    test_results = [
        {"test_id": "t1", "passed": True, "input_size": 4},
        {"test_id": "t2", "passed": passed_empty_input, "input_size": 0,
         "expected": 0, "actual": "0" if passed_empty_input else "IndexError"},
    ]
    static_analysis = {
        "cyclomatic_complexity": 4,
        "time_complexity_estimate": "O(n^2)",
        "flags": [] if passed_empty_input else ["no_empty_input_guard"],
    }
    diag = misconceptions.diagnose_code(
        STUDENT, "p_lis_003", TOPIC,
        code="def lis(nums): ...",
        test_results=test_results,
        static_analysis=static_analysis,
    )
    bkt_result = bkt.update_mastery(STUDENT, TOPIC, diag["is_correct"])
    log_attempt(diag, bkt_result)
    return diag, bkt_result


print("=== Step 1-2: simulate 4 attempts on dsa.dp.lis (1 pass, 3 fail on empty-input base case) ===")
submit_code(passed_empty_input=True)
for i in range(3):
    diag, bkt_result = submit_code(passed_empty_input=False)
    print(f"attempt {i+1}: correct={diag['is_correct']} misconception={diag['misconception_id']} "
          f"confidence={diag['confidence']} | p_mastery {bkt_result['p_mastery_prev']} -> {bkt_result['p_mastery']}")

# force recursion.base_cases mastery low so the trace has a real ancestor to find
with get_cursor() as cur:
    cur.execute(
        """INSERT INTO mastery_state (student_id, topic_id, p_mastery, attempts, last_updated)
           VALUES (%s,'dsa.recursion.base_cases',0.41,3,now())
           ON CONFLICT (student_id, topic_id) DO UPDATE SET p_mastery=0.41""",
        (STUDENT,),
    )
    cur.execute(
        """INSERT INTO mastery_state (student_id, topic_id, p_mastery, attempts, last_updated)
           VALUES (%s,'dsa.recursion.general',0.58,3,now())
           ON CONFLICT (student_id, topic_id) DO UPDATE SET p_mastery=0.58""",
        (STUDENT,),
    )

print("\n=== Step 3: root-cause trace from dsa.dp.lis ===")
trace = root_cause.trace_root_cause(STUDENT, TOPIC, mastery_threshold=0.6)
print(trace)

print("\n=== misconception occurrence count (for the narrative's '3 of last 4') ===")
with get_cursor() as cur:
    cur.execute(
        "SELECT COUNT(*) AS c FROM attempts WHERE student_id=%s AND misconception_id='dp.missing_base_case'",
        (STUDENT,),
    )
    occ = cur.fetchone()["c"]
    cur.execute("SELECT COUNT(*) AS c FROM attempts WHERE student_id=%s AND topic_id=%s", (STUDENT, TOPIC))
    total = cur.fetchone()["c"]
print(f"{occ} of last {total} attempts on {TOPIC}")

# backdate recursion.base_cases last_correct so forgetting curve has something to say
with get_cursor() as cur:
    cur.execute(
        """UPDATE mastery_state SET p_mastery=0.9, last_correct_at=%s
           WHERE student_id=%s AND topic_id='dsa.graphs.bfs'""",
        (datetime.now(timezone.utc) - timedelta(days=44), STUDENT),
    )
    # need attempts>0 row to exist; ensure it does
    cur.execute(
        """INSERT INTO mastery_state (student_id, topic_id, p_mastery, attempts, last_correct_at, last_updated)
           VALUES (%s,'dsa.graphs.bfs',0.9,3,%s,now())
           ON CONFLICT (student_id, topic_id) DO UPDATE SET p_mastery=0.9, last_correct_at=%s""",
        (STUDENT, datetime.now(timezone.utc) - timedelta(days=44), datetime.now(timezone.utc) - timedelta(days=44)),
    )

print("\n=== Step 4: forgetting-curve batch ===")
fc = forgetting_curve.run_forgetting_curve_batch(STUDENT)
print(fc)

print("\n=== Step 5: composed narrative (matches doc's UX example) ===")
weeks_ago = 2  # would be computed from mastery_state.last_updated on the root-cause node
narrative = (
    f"You're consistently missing the base case in recursive solutions before moving to "
    f"memoization — this showed up in {occ} of your last {total} DP attempts, and traces "
    f"back to a gap in your recursion fundamentals from {weeks_ago} weeks ago."
)
print(narrative)

"""
Two diagnosis paths, one output shape (see contract doc section 1).

MCQ path: O(1) — every distractor is pre-tagged at content-creation time,
this is a join, never a model call.

Code path: static analysis flags + failing tests go to an LLM constrained
to structured JSON output. USE_LLM_DIAGNOSIS=false (default) runs a
rule-based fallback instead so the pipeline is fully runnable/demoable
with zero API cost or network dependency; flip the env var + set
ANTHROPIC_API_KEY to use the real classifier.
"""
import json
import os
from app.db import get_cursor
from app.errors import TopicNotFound, LLMTimeout

USE_LLM_DIAGNOSIS = os.environ.get("USE_LLM_DIAGNOSIS", "false").lower() == "true"

VALID_ERROR_TYPES = {
    "wrong_approach", "edge_case_missed", "complexity_issue",
    "off_by_one", "syntax", "conceptual_gap",
}


def diagnose_mcq(student_id: str, question_id: str, selected_option_id: str) -> dict:
    with get_cursor() as cur:
        cur.execute(
            """
            SELECT q.topic_id, q.correct_option_id, o.misconception_id, m.error_type
            FROM mcq_questions q
            JOIN mcq_options o ON o.question_id = q.question_id AND o.option_id = %s
            LEFT JOIN misconceptions m ON m.misconception_id = o.misconception_id
            WHERE q.question_id = %s
            """,
            (selected_option_id, question_id),
        )
        row = cur.fetchone()
        if row is None:
            raise TopicNotFound(f"question_id {question_id} / option {selected_option_id} not found")

        is_correct = selected_option_id == row["correct_option_id"]
        return {
            "student_id": student_id,
            "topic_id": row["topic_id"],
            "is_correct": is_correct,
            "misconception_id": None if is_correct else row["misconception_id"],
            "error_type": None if is_correct else row["error_type"],
            "confidence": 1.0 if not is_correct and row["misconception_id"] else None,
            "evidence": None if is_correct else "distractor-tagged misconception (deterministic lookup)",
            "source": "mcq_lookup",
        }


def _rule_based_code_diagnosis(topic_id: str, test_results: list[dict], static_analysis: dict) -> dict:
    flags = static_analysis.get("flags", [])
    failing = [t for t in test_results if not t.get("passed", True)]

    # smallest-input-first heuristic: failure on input_size == 0/1 + a missing-guard flag
    # almost always means base-case/edge-case handling, not algorithmic approach
    smallest_failure = min(failing, key=lambda t: t.get("input_size", 999)) if failing else None

    if "no_empty_input_guard" in flags and smallest_failure and smallest_failure.get("input_size", 999) <= 1:
        misconception_id = f"{topic_id.split('.')[1] if '.' in topic_id else 'general'}.missing_base_case"
        return {
            "misconception_id": misconception_id,
            "error_type": "edge_case_missed",
            "confidence": 0.65,  # capped lower than LLM path — this is a heuristic, not a read of the code
            "evidence": f"Fails on smallest input (size={smallest_failure.get('input_size')}); "
                        f"static analysis flags missing empty-input guard.",
        }

    if "off_by_one" in flags:
        return {
            "misconception_id": f"{topic_id.split('.')[1] if '.' in topic_id else 'general'}.off_by_one_bounds",
            "error_type": "off_by_one",
            "confidence": 0.6,
            "evidence": "Static analysis flagged an off-by-one pattern in loop/index bounds.",
        }

    if failing and not flags:
        return {
            "misconception_id": None,
            "error_type": "wrong_approach",
            "confidence": 0.4,
            "evidence": f"{len(failing)}/{len(test_results)} tests fail with no specific static-analysis flag; "
                        f"insufficient signal to name a specific misconception without LLM pass.",
        }

    return {
        "misconception_id": None,
        "error_type": None,
        "confidence": 0.0,
        "evidence": "All tests pass; no misconception detected.",
    }


def _llm_code_diagnosis(topic_id: str, code: str, test_results: list[dict], static_analysis: dict) -> dict:
    import anthropic  # imported lazily so the module still loads w/o the package when unused

    client = anthropic.Anthropic()  # reads ANTHROPIC_API_KEY from env
    system = (
        "You are a code-diagnosis classifier for a DSA interview-prep tool. "
        "Given a student's code, its test results, and static analysis, output ONLY a JSON object "
        '(no markdown, no prose) with exactly these keys: '
        '{"misconception_id": string|null, "error_type": one of '
        '["wrong_approach","edge_case_missed","complexity_issue","off_by_one","syntax","conceptual_gap"]|null, '
        '"confidence": float 0-1, "evidence": string, max 200 chars}. '
        "misconception_id should be a short dot-namespaced label like 'dp.missing_base_case'. "
        "If all tests pass, return misconception_id null, error_type null, confidence 0."
    )
    user_payload = {
        "topic_id": topic_id,
        "code": code,
        "test_results": test_results,
        "static_analysis": static_analysis,
    }
    try:
        resp = client.messages.create(
            model="claude-sonnet-4-6",
            max_tokens=300,
            system=system,
            messages=[{"role": "user", "content": json.dumps(user_payload)}],
        )
        text = "".join(b.text for b in resp.content if b.type == "text").strip()
        parsed = json.loads(text)
        if parsed.get("error_type") not in VALID_ERROR_TYPES and parsed.get("error_type") is not None:
            parsed["error_type"] = "conceptual_gap"
        return parsed
    except Exception as e:
        raise LLMTimeout(f"LLM diagnosis call failed: {e}")


def diagnose_code(
    student_id: str,
    problem_id: str,
    topic_id: str,
    code: str,
    test_results: list[dict],
    static_analysis: dict,
) -> dict:
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM topics WHERE topic_id = %s", (topic_id,))
        if cur.fetchone() is None:
            raise TopicNotFound(f"topic_id {topic_id} not found")

    all_passed = all(t.get("passed", True) for t in test_results)

    if USE_LLM_DIAGNOSIS and not all_passed:
        try:
            result = _llm_code_diagnosis(topic_id, code, test_results, static_analysis)
            source = "code_llm_pass"
        except LLMTimeout:
            result = _rule_based_code_diagnosis(topic_id, test_results, static_analysis)
            source = "code_rule_fallback_after_llm_timeout"
    else:
        result = _rule_based_code_diagnosis(topic_id, test_results, static_analysis)
        source = "code_rule_based" if not all_passed else "code_rule_based"

    return {
        "student_id": student_id,
        "topic_id": topic_id,
        "is_correct": all_passed,
        "misconception_id": result.get("misconception_id"),
        "error_type": result.get("error_type"),
        "confidence": result.get("confidence"),
        "evidence": result.get("evidence"),
        "source": source,
    }

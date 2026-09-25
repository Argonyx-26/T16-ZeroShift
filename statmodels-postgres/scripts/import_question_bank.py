"""Import a validated JSON MCQ bank into PostgreSQL.

Expected JSON shape:
[
  {
    "question_id": "dsa-q001",
    "domain": "dsa",
    "topic_id": "dsa.asymptotic-analysis",
    "difficulty": "easy",
    "prompt": "Which function grows fastest?",
    "correct_option_id": "a",
    "options": [
      {"option_id": "a", "option_text": "..."},
      {"option_id": "b", "option_text": "..."}
    ]
  }
]
"""
import json
import sys
from pathlib import Path

from app.db import get_cursor

VALID_DIFFICULTIES = {"easy", "intermediate", "hard"}


def validate_question(question: dict) -> None:
    required = {"question_id", "domain", "topic_id", "difficulty", "prompt", "correct_option_id", "options"}
    missing = required - question.keys()
    if missing:
        raise ValueError(f"Missing fields for question: {sorted(missing)}")
    if question["difficulty"] not in VALID_DIFFICULTIES:
        raise ValueError(f"Invalid difficulty: {question['difficulty']}")
    option_ids = {option["option_id"] for option in question["options"]}
    if question["correct_option_id"] not in option_ids:
        raise ValueError(f"Correct option is not present: {question['question_id']}")


def import_questions(path: Path) -> None:
    questions = json.loads(path.read_text(encoding="utf-8"))
    if not isinstance(questions, list) or not questions:
        raise ValueError("Question bank must be a non-empty JSON list")
    for question in questions:
        validate_question(question)

    with get_cursor() as cur:
        for question in questions:
            display_name = question["topic_id"].rsplit(".", 1)[-1].replace("-", " ").title()
            cur.execute(
                """INSERT INTO topics (topic_id, domain, display_name, difficulty)
                   VALUES (%s,%s,%s,3) ON CONFLICT (topic_id) DO NOTHING""",
                (question["topic_id"], question["domain"], display_name),
            )
            cur.execute(
                """INSERT INTO mcq_questions
                   (question_id, topic_id, prompt, difficulty, correct_option_id)
                   VALUES (%s,%s,%s,%s,%s)
                   ON CONFLICT (question_id) DO UPDATE SET
                     topic_id=EXCLUDED.topic_id, prompt=EXCLUDED.prompt,
                     difficulty=EXCLUDED.difficulty,
                     correct_option_id=EXCLUDED.correct_option_id""",
                (question["question_id"], question["topic_id"], question["prompt"],
                 question["difficulty"], question["correct_option_id"]),
            )
            cur.execute(
                "DELETE FROM mcq_options WHERE question_id=%s",
                (question["question_id"],),
            )
            for option in question["options"]:
                cur.execute(
                    """INSERT INTO mcq_options
                       (question_id, option_id, option_text, misconception_id)
                       VALUES (%s,%s,%s,%s)""",
                    (question["question_id"], option["option_id"],
                     option["option_text"], option.get("misconception_id")),
                )
    print(f"Imported {len(questions)} questions.")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: PYTHONPATH=. python scripts/import_question_bank.py path/to/questions.json")
    import_questions(Path(sys.argv[1]))

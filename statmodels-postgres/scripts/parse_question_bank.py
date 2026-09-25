"""Convert the supplied Word/plain-text question bank into importer JSON.

The source must contain the four headings DSA, DBMS, SYSTEM DESIGN, and
WEB DEVELOPMENT, numbered questions Q1..Q60, four A-D options, and an
Answer line for every question. The parser intentionally fails on incomplete
questions instead of guessing missing formulas or options.
"""
import html
import json
import re
import sys
from pathlib import Path

DOMAINS = {
    "DSA": "dsa",
    "DBMS": "dbms",
    "SYSTEM DESIGN": "system_design",
    "WEB DEVELOPMENT": "web_dev",
}
QUESTION_RE = re.compile(r"^Q(\d+)\.\s*(?:\[([^]]+)\])?\s*(.*)$", re.IGNORECASE)
OPTION_RE = re.compile(r"^([A-D])\.\s*(.*)$")
ANSWER_RE = re.compile(r"^Answer:\s*([A-D])(?:\.|\s|$)", re.IGNORECASE)
SECTION_RE = re.compile(r"^(?:[🟡🔴]?[\s-]*(?:EASY|MEDIUM|HARD).*)$", re.IGNORECASE)


def clean_line(line: str) -> str:
    line = html.unescape(line).replace("\u00a0", " ")
    line = re.sub(r"<[^>]+>", "", line)
    return re.sub(r"\s+", " ", line).strip()


def slug(value: str) -> str:
    value = re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")
    return value or "general"


def parse_source(path: Path) -> list[dict]:
    raw_lines = [clean_line(line) for line in path.read_text(encoding="utf-8").splitlines()]
    questions = []
    domain = None
    pending_system_heading = False
    current = None
    option = None
    seen_numbers = {}

    def finish_question() -> None:
        nonlocal current, option
        if current is None:
            return
        if len(current["options"]) != 4:
            raise ValueError(f"{current['question_id']} has {len(current['options'])} options")
        if not current.get("correct_option_id"):
            raise ValueError(f"{current['question_id']} has no answer")
        if not current["prompt"]:
            raise ValueError(f"{current['question_id']} has no prompt")
        questions.append(current)
        current = None
        option = None

    for line in raw_lines:
        if not line:
            continue
        upper = line.upper()
        if upper == "SYSTEM":
            pending_system_heading = True
            continue
        if pending_system_heading and upper == "DESIGN":
            finish_question()
            domain = DOMAINS["SYSTEM DESIGN"]
            pending_system_heading = False
            continue
        if upper in DOMAINS:
            finish_question()
            domain = DOMAINS[upper]
            pending_system_heading = False
            continue
        match = QUESTION_RE.match(line)
        if match:
            finish_question()
            if domain is None:
                raise ValueError(f"Question appears before a domain heading: {line}")
            number = int(match.group(1))
            if number < 1 or number > 60:
                raise ValueError(f"Question number outside 1..60: {line}")
            if number in seen_numbers.get(domain, set()):
                raise ValueError(f"Duplicate question {domain} Q{number}")
            seen_numbers.setdefault(domain, set()).add(number)
            topic = slug(match.group(2) or "general")
            current = {
                "question_id": f"{domain}-q{number:03d}",
                "domain": domain,
                "topic_id": f"{domain}.{topic}",
                "difficulty": "easy" if number <= 20 else "intermediate" if number <= 40 else "hard",
                "prompt": match.group(3),
                "correct_option_id": None,
                "options": [],
            }
            continue
        if current is None:
            continue
        answer = ANSWER_RE.match(line)
        if answer:
            current["correct_option_id"] = answer.group(1).lower()
            option = None
            continue
        option_match = OPTION_RE.match(line)
        if option_match:
            option_id = option_match.group(1).lower()
            current["options"].append({"option_id": option_id, "option_text": option_match.group(2)})
            option = current["options"][-1]
            continue
        if option is not None and not SECTION_RE.match(line):
            option["option_text"] = f"{option['option_text']} {line}".strip()
        elif not SECTION_RE.match(line) and not current["correct_option_id"]:
            current["prompt"] = f"{current['prompt']} {line}".strip()

    finish_question()
    expected = 4 * 60
    if len(questions) != expected:
        counts = {domain: sum(q["domain"] == domain for q in questions) for domain in DOMAINS.values()}
        raise ValueError(f"Expected {expected} questions, parsed {len(questions)}: {counts}")
    return questions


def main() -> None:
    if len(sys.argv) != 3:
        raise SystemExit("Usage: PYTHONPATH=. python scripts/parse_question_bank.py source.txt output.json")
    questions = parse_source(Path(sys.argv[1]))
    Path(sys.argv[2]).write_text(json.dumps(questions, indent=2, ensure_ascii=False) + "\n", encoding="utf-8")
    print(f"Parsed {len(questions)} questions into {sys.argv[2]}")


if __name__ == "__main__":
    main()

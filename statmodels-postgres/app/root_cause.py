"""
Backward BFS over the prerequisite DAG from a failing topic, returning the
EARLIEST unmastered ancestor — not the immediate parent. That distinction is
the entire value of this feature: "you're bad at DP" is a symptom, "you never
actually nailed recursion base cases" is the cause.

Ties (multiple ancestors at the same BFS depth below threshold) are broken by
picking the one with the lowest p_mastery — the weakest link, not just the
first one found in iteration order.
"""
from collections import deque
from app.db import get_cursor
from app.errors import TopicNotFound


def _get_mastery_map(cur, student_id: str, topic_ids: list[str]) -> dict[str, float]:
    if not topic_ids:
        return {}
    cur.execute(
        "SELECT topic_id, p_mastery FROM mastery_state WHERE student_id=%s AND topic_id = ANY(%s)",
        (student_id, topic_ids),
    )
    found = {r["topic_id"]: float(r["p_mastery"]) for r in cur.fetchall()}
    # unattempted topics have no BKT row — treat as p_init for that topic, fetched separately
    missing = [t for t in topic_ids if t not in found]
    if missing:
        cur.execute("SELECT topic_id, p_init FROM topics WHERE topic_id = ANY(%s)", (missing,))
        for r in cur.fetchall():
            found[r["topic_id"]] = float(r["p_init"])
    return found


def trace_root_cause(student_id: str, failing_topic_id: str, mastery_threshold: float = 0.6) -> dict:
    with get_cursor() as cur:
        cur.execute("SELECT 1 FROM topics WHERE topic_id = %s", (failing_topic_id,))
        if cur.fetchone() is None:
            raise TopicNotFound(f"topic_id {failing_topic_id} not in prerequisite DAG")

        # BFS backward over prereq edges, tracking the path to each visited node
        visited = {failing_topic_id}
        queue = deque([(failing_topic_id, [failing_topic_id])])
        candidates = []  # (depth, p_mastery, topic_id, path)
        depth = 0

        while queue:
            level_size = len(queue)
            depth += 1
            for _ in range(level_size):
                node, path = queue.popleft()
                cur.execute(
                    "SELECT prereq_topic_id FROM prerequisite_edges WHERE topic_id = %s",
                    (node,),
                )
                prereqs = [r["prereq_topic_id"] for r in cur.fetchall()]
                if not prereqs:
                    continue
                mastery = _get_mastery_map(cur, student_id, prereqs)
                for p in prereqs:
                    if p in visited:
                        continue
                    visited.add(p)
                    new_path = path + [p]
                    if mastery.get(p, 0.0) < mastery_threshold:
                        candidates.append((depth, mastery.get(p, 0.0), p, new_path))
                    queue.append((p, new_path))

        if not candidates:
            path_mastery = _get_mastery_map(cur, student_id, [failing_topic_id])
            return {
                "student_id": student_id,
                "failing_topic_id": failing_topic_id,
                "root_cause_topic_id": failing_topic_id,
                "path": [failing_topic_id],
                "path_mastery": [round(path_mastery.get(failing_topic_id, 0.0), 4)],
                "root_cause_found": False,
            }

        # deepest candidate = earliest true root cause; break ties by lowest mastery
        candidates.sort(key=lambda c: (-c[0], c[1]))
        _, _, root_topic, path = candidates[0]
        mastery_map = _get_mastery_map(cur, student_id, path)

        return {
            "student_id": student_id,
            "failing_topic_id": failing_topic_id,
            "root_cause_topic_id": root_topic,
            "path": path,
            "path_mastery": [round(mastery_map.get(t, 0.0), 4) for t in path],
            "root_cause_found": True,
        }

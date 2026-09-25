"""
PLACEHOLDER seed data — a small DSA slice reproducing the doc's example
(recursion -> DP root-cause trace). Swap this for the real curriculum
topic IDs / MCQ bank once they're sent over; nothing downstream depends
on these specific IDs, only on the schema shape.
"""
from app.db import get_cursor
from app.resources import RESOURCES

TOPICS = [
    # topic_id, domain, display_name, difficulty
    ("dsa.recursion.base_cases", "dsa", "Recursion: Base Cases", 2),
    ("dsa.recursion.general", "dsa", "Recursion Fundamentals", 2),
    ("dsa.dp.memoization", "dsa", "DP: Memoization", 3),
    ("dsa.dp.lis", "dsa", "DP: Longest Increasing Subsequence", 4),
    ("dsa.dp.knapsack", "dsa", "DP: 0/1 Knapsack", 4),
    ("dsa.arrays.two_pointer", "dsa", "Arrays: Two Pointer", 2),
    ("dsa.trees.traversal", "dsa", "Binary Trees: Traversals", 3),
    ("dsa.graphs.bfs", "dsa", "Graphs: BFS", 3),
    ("dsa.graphs.dfs", "dsa", "Graphs: DFS", 3),
    ("dbms.transactions", "dbms", "DBMS: Transactions & ACID", 2),
    ("system_design.fundamentals", "system_design", "System Design: Scalability & Load Balancing", 3),
    ("web_dev.javascript", "web_dev", "JavaScript: Event Loop & Promises", 2),
]

EDGES = [
    # (topic_id, prereq_topic_id)  -- topic_id depends on prereq_topic_id
    ("dsa.dp.memoization", "dsa.recursion.general"),
    ("dsa.recursion.general", "dsa.recursion.base_cases"),
    ("dsa.dp.lis", "dsa.dp.memoization"),
    ("dsa.dp.knapsack", "dsa.dp.memoization"),
    ("dsa.graphs.bfs", "dsa.arrays.two_pointer"),
    ("dsa.trees.traversal", "dsa.recursion.general"),
]

MISCONCEPTIONS = [
    # misconception_id, topic_id, description, error_type
    ("recursion.missing_base_case", "dsa.recursion.base_cases",
     "Doesn't define a terminating base case, or defines it incorrectly", "edge_case_missed"),
    ("dp.missing_base_case", "dsa.dp.lis",
     "Applies memoization without a correct base case for empty/trivial input", "edge_case_missed"),
    ("graph.confuses_bfs_dfs_structure", "dsa.graphs.bfs",
     "Uses a stack instead of a queue (or vice versa), confusing BFS/DFS traversal order", "wrong_approach"),
    ("binary_search.off_by_one_bounds", "dsa.arrays.two_pointer",
     "Off-by-one error in loop/pointer bounds", "off_by_one"),
    ("trees.confuses_pre_post_order", "dsa.trees.traversal",
     "Confuses root visit order relative to children subtrees", "wrong_approach"),
    ("dbms.confuses_isolation_levels", "dbms.transactions",
     "Confuses repeatable read with serializable isolation", "conceptual_gap"),
]

MCQS = [
    # question_id, topic_id, prompt, difficulty, correct_option_id, options
    ("q_trees_001", "dsa.trees.traversal",
     "Which tree traversal visits the root node before its left and right subtrees?", "easy",
     "opt_b", [
         ("opt_a", "Inorder Traversal (Left, Root, Right)", None),
         ("opt_b", "Preorder Traversal (Root, Left, Right)", None),
         ("opt_c", "Postorder Traversal (Left, Right, Root)", "trees.confuses_pre_post_order"),
         ("opt_d", "Level-order Traversal (Breadth-First)", None),
     ]),
    ("q_bfs_014", "dsa.graphs.bfs",
     "Which data structure does Breadth-First Search (BFS) use to track nodes to visit next?", "easy",
     "opt_a", [
         ("opt_a", "Queue (FIFO - First In First Out)", None),
         ("opt_c", "Stack (LIFO - Last In First Out)", "graph.confuses_bfs_dfs_structure"),
         ("opt_b", "Priority Queue (Min/Max Heap)", None),
         ("opt_d", "Hash Map", None),
     ]),
    ("q_dp_002", "dsa.dp.memoization",
     "What are the two core prerequisites necessary for a problem to be solvable via Dynamic Programming?", "intermediate",
     "opt_b", [
         ("opt_a", "Greedy choice property & sorted array", None),
         ("opt_b", "Overlapping subproblems & optimal substructure", None),
         ("opt_c", "Binary tree structure & O(1) space", None),
         ("opt_d", "Divide and conquer without state repetition", None),
     ]),
    ("q_dp_003", "dsa.dp.knapsack",
     "In the 0/1 Knapsack problem with N items and capacity W, what is the standard 2D DP time complexity?", "hard",
     "opt_a", [
         ("opt_a", "O(N * W)", None),
         ("opt_b", "O(2^N)", "dp.missing_base_case"),
         ("opt_c", "O(N log N)", None),
         ("opt_d", "O(W^2)", None),
     ]),
    ("q_arrays_003", "dsa.arrays.two_pointer",
     "When searching for a pair with a target sum in a sorted array, what is the optimal two-pointer time complexity?", "easy",
     "opt_c", [
         ("opt_a", "O(N^2)", None),
         ("opt_b", "O(N log N)", None),
         ("opt_c", "O(N)", None),
         ("opt_d", "O(1)", None),
     ]),
    ("q_dbms_001", "dbms.transactions",
     "In ACID properties of database transactions, what does the 'I' stand for?", "easy",
     "opt_b", [
         ("opt_a", "Integrity", None),
         ("opt_b", "Isolation", None),
         ("opt_c", "Immutability", None),
         ("opt_d", "Indexing", None),
     ]),
    ("q_sys_001", "system_design.fundamentals",
     "Which load balancing algorithm distributes requests sequentially across a list of servers?", "easy",
     "opt_a", [
         ("opt_a", "Round Robin", None),
         ("opt_b", "Least Connections", None),
         ("opt_c", "IP Hash", None),
         ("opt_d", "Consistent Hashing", None),
     ]),
    ("q_web_001", "web_dev.javascript",
     "In the JavaScript event loop, which queue has higher priority to execute after the current call stack clears?", "intermediate",
     "opt_a", [
         ("opt_a", "Microtask Queue (Promises, queueMicrotask)", None),
         ("opt_b", "Macrotask Queue (setTimeout, setInterval)", None),
         ("opt_c", "Rendering Pipeline", None),
         ("opt_d", "I/O Polling Queue", None),
     ]),
]


def seed():
    with get_cursor() as cur:
        for topic_id, domain, name, diff in TOPICS:
            cur.execute(
                """INSERT INTO topics (topic_id, domain, display_name, difficulty)
                   VALUES (%s,%s,%s,%s) ON CONFLICT (topic_id) DO NOTHING""",
                (topic_id, domain, name, diff),
            )
        for topic_id, prereq_id in EDGES:
            cur.execute(
                """INSERT INTO prerequisite_edges (topic_id, prereq_topic_id)
                   VALUES (%s,%s) ON CONFLICT DO NOTHING""",
                (topic_id, prereq_id),
            )
        for mid, topic_id, desc, err_type in MISCONCEPTIONS:
            cur.execute(
                """INSERT INTO misconceptions (misconception_id, topic_id, description, error_type)
                   VALUES (%s,%s,%s,%s) ON CONFLICT (misconception_id) DO NOTHING""",
                (mid, topic_id, desc, err_type),
            )
        for qid, topic_id, prompt, difficulty, correct, options in MCQS:
            cur.execute(
                """INSERT INTO mcq_questions
                   (question_id, topic_id, prompt, difficulty, correct_option_id)
                   VALUES (%s,%s,%s,%s,%s)
                   ON CONFLICT (question_id) DO UPDATE SET
                     topic_id=EXCLUDED.topic_id, prompt=EXCLUDED.prompt,
                     difficulty=EXCLUDED.difficulty, correct_option_id=EXCLUDED.correct_option_id""",
                (qid, topic_id, prompt, difficulty, correct),
            )
            for opt_id, text, misc_id in options:
                cur.execute(
                    """INSERT INTO mcq_options (question_id, option_id, option_text, misconception_id)
                       VALUES (%s,%s,%s,%s) ON CONFLICT DO NOTHING""",
                    (qid, opt_id, text, misc_id),
                )
        for resource in RESOURCES:
            display_mode = "video" if resource["can_embed"] else (
                "file" if resource["resource_type"] in {"article", "documentation", "tutorial"}
                else "external_link"
            )
            cur.execute(
                """INSERT INTO study_materials
                   (material_id, domain, topic_id, title, material_type, display_mode,
                    level, duration, url, can_embed)
                   VALUES (%s,%s,%s,%s,%s,%s,%s,%s,%s,%s)
                   ON CONFLICT (material_id) DO UPDATE SET
                     domain=EXCLUDED.domain, topic_id=EXCLUDED.topic_id,
                     title=EXCLUDED.title, material_type=EXCLUDED.material_type,
                     display_mode=EXCLUDED.display_mode, level=EXCLUDED.level,
                     duration=EXCLUDED.duration, url=EXCLUDED.url,
                     can_embed=EXCLUDED.can_embed""",
                (resource["resource_id"], resource["domain"], resource["topic_id"],
                 resource["title"], resource["resource_type"], display_mode,
                 resource["level"], resource["duration"], resource["url"],
                 resource["can_embed"]),
            )
        cur.execute(
            """INSERT INTO students (student_id, target_role, timeline_weeks)
               VALUES ('s_1029','sde',8) ON CONFLICT DO NOTHING"""
        )
    print("seeded.")


if __name__ == "__main__":
    seed()

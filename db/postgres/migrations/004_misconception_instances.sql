-- 004_misconceptions.sql
-- Canonical misconception labels attached to a topic. These are the stable
-- tags the diagnosis agent and content team reuse across MCQ and code paths.

CREATE TABLE misconceptions (
    misconception_id     TEXT PRIMARY KEY,
    topic_id             TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    description          TEXT NOT NULL,
    error_type           TEXT NOT NULL CHECK (
        error_type IN (
            'wrong_approach',
            'edge_case_missed',
            'complexity_issue',
            'off_by_one',
            'syntax',
            'conceptual_gap'
        )
    )
);

CREATE INDEX idx_misconceptions_topic_id ON misconceptions(topic_id);
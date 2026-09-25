-- 006_attempts.sql
-- Permanent audit log for all MCQ/code attempts. For code-path diagnoses, the
-- question_id may be NULL and misconception_id/error_type are populated by the
-- LLM classifier or downstream analysis.

CREATE TABLE attempts (
    attempt_id            BIGSERIAL PRIMARY KEY,
    student_id            TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    topic_id              TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    source                TEXT NOT NULL CHECK (source IN ('mcq', 'code', 'mixed')),
    question_id           TEXT,
    is_correct            BOOLEAN NOT NULL,
    misconception_id      TEXT REFERENCES misconceptions(misconception_id) ON DELETE SET NULL,
    confidence            NUMERIC(5,4) CHECK (confidence BETWEEN 0 AND 1),
    evidence              TEXT,
    p_mastery_before      NUMERIC(5,4) CHECK (p_mastery_before BETWEEN 0 AND 1),
    p_mastery_after       NUMERIC(5,4) CHECK (p_mastery_after BETWEEN 0 AND 1),
    created_at            TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_attempts_student_id ON attempts(student_id);
CREATE INDEX idx_attempts_topic_id ON attempts(topic_id);
CREATE INDEX idx_attempts_created_at ON attempts(created_at DESC);
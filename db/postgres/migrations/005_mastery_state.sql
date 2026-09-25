-- 005_mastery_state.sql
-- One row per (student, topic). The BKT engine owns this table and writes the
-- current mastery estimate for each topic the learner has interacted with.

CREATE TABLE mastery_state (
    student_id             TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    topic_id               TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    p_mastery              NUMERIC(5,4) NOT NULL CHECK (p_mastery BETWEEN 0 AND 1),
    attempts               INTEGER NOT NULL DEFAULT 0 CHECK (attempts >= 0),
    last_correct_at        TIMESTAMPTZ,
    last_updated           TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, topic_id)
);

CREATE INDEX idx_mastery_state_student_id ON mastery_state(student_id);
CREATE INDEX idx_mastery_state_topic_id ON mastery_state(topic_id);
CREATE INDEX idx_mastery_state_last_updated ON mastery_state(last_updated DESC);
-- 007_reinject_queue.sql
-- Topics the forgetting-curve job has flagged for a refresh or low-stakes
-- re-entry. One row per flagged instance; `served` marks whether it has been
-- surfaced to the student already.

CREATE TABLE reinject_queue (
    student_id          TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    topic_id            TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    retention           NUMERIC(5,4) NOT NULL CHECK (retention BETWEEN 0 AND 1),
    computed_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
    served              BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (student_id, topic_id, computed_at)
);

CREATE INDEX idx_reinject_queue_student_id ON reinject_queue(student_id);
CREATE INDEX idx_reinject_queue_served ON reinject_queue(served);
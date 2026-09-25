-- 010_ide_sessions.sql
-- VS Code companion feature, independent of the quiz -> misconception ->
-- mastery -> prerequisite pipeline. It is keyed to the student ID rather than
-- the legacy auth UUID table.

CREATE TABLE ide_sessions (
    id                          UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    student_id                  TEXT NOT NULL REFERENCES students(student_id) ON DELETE CASCADE,
    session_start               TIMESTAMPTZ NOT NULL,
    session_end                 TIMESTAMPTZ,
    active_time_seconds         BIGINT,
    idle_time_seconds           BIGINT,
    companion_nudges_sent       INTEGER NOT NULL DEFAULT 0,
    companion_nudges_accepted   INTEGER NOT NULL DEFAULT 0,
    created_at                  TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                  TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_ide_sessions_student_id ON ide_sessions(student_id);
CREATE INDEX idx_ide_sessions_student_start ON ide_sessions(student_id, session_start DESC);
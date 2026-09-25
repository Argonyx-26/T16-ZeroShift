-- 002_students.sql
-- Student IDs are opaque app-level strings, not generated UUIDs, so they can
-- be keyed to the auth provider or external identity service without forcing a
-- DB-level UUID convention.

CREATE TABLE students (
    student_id       TEXT PRIMARY KEY,
    target_role      TEXT,
    timeline_weeks   SMALLINT CHECK (timeline_weeks >= 0)
);
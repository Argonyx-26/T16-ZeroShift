-- 011_consent_preferences.sql
-- 1:1 with students. Default false — consent must be explicitly granted,
-- especially for focus_monitoring and diagnostic tracking.

CREATE TABLE consent_preferences (
    student_id                 TEXT PRIMARY KEY REFERENCES students(student_id) ON DELETE CASCADE,
    tracks_diagnosis           BOOLEAN NOT NULL DEFAULT false,
    tracks_focus_monitoring     BOOLEAN NOT NULL DEFAULT false,
    tracks_ide_activity        BOOLEAN NOT NULL DEFAULT false,
    created_at                 TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at                 TIMESTAMPTZ NOT NULL DEFAULT now()
);
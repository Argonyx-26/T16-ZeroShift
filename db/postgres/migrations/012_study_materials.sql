-- 012_study_materials.sql
-- SQL-backed study materials catalog supporting video, file, and external_link display modes.

CREATE TABLE IF NOT EXISTS study_materials (
    material_id     TEXT PRIMARY KEY,
    domain          TEXT NOT NULL CHECK (domain IN ('dsa','dbms','system_design','web_dev')),
    topic_id        TEXT,
    title           TEXT NOT NULL,
    material_type   TEXT NOT NULL CHECK (material_type IN ('video','document','article','practice','course','roadmap','reference','visualization','tutorial')),
    display_mode    TEXT NOT NULL CHECK (display_mode IN ('video','file','external_link')),
    level           TEXT,
    duration        TEXT,
    url             TEXT NOT NULL,
    can_embed       BOOLEAN NOT NULL DEFAULT false,
    is_active       BOOLEAN NOT NULL DEFAULT true,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_study_materials_filters
    ON study_materials (domain, topic_id, material_type, is_active);

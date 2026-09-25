-- Argonyx Unified Schema
-- Contains both auth tables (owned by auth-service) and stat-models / learning-trace
-- tables (owned by statmodels-postgres). All live in the same PostgreSQL database
-- so foreign keys can enforce referential integrity across services.

CREATE EXTENSION IF NOT EXISTS "pgcrypto"; -- for gen_random_uuid()

-- ============================================================================
-- AUTH TABLES (owned by auth-service)
-- ============================================================================

CREATE TABLE IF NOT EXISTS users (
    id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    email           TEXT NOT NULL UNIQUE,
    password_hash   TEXT,                 -- NULL if the user only ever signed in via Google
    name            TEXT NOT NULL,
    google_id       TEXT UNIQUE,          -- NULL if the user only ever used email/password
    avatar_url      TEXT,
    email_verified  BOOLEAN NOT NULL DEFAULT FALSE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT now(),

    CONSTRAINT users_has_login_method CHECK (
        password_hash IS NOT NULL OR google_id IS NOT NULL
    )
);

CREATE TABLE IF NOT EXISTS refresh_tokens (
    id           UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id      UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token_hash   TEXT NOT NULL,     -- SHA-256 hash of the refresh token; the raw token is never stored
    user_agent   TEXT,
    ip_address   TEXT,
    expires_at   TIMESTAMPTZ NOT NULL,
    revoked_at   TIMESTAMPTZ,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_refresh_tokens_user_id ON refresh_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_refresh_tokens_token_hash ON refresh_tokens(token_hash);
CREATE INDEX IF NOT EXISTS idx_users_google_id ON users(google_id);

-- Keep updated_at current on every row update
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trg_users_updated_at ON users;
CREATE TRIGGER trg_users_updated_at
    BEFORE UPDATE ON users
    FOR EACH ROW
    EXECUTE FUNCTION set_updated_at();

-- ============================================================================
-- STAT MODELS & CURRICULUM TABLES (owned by statmodels-postgres)
-- Frontend/backend teammates read via API only, never write these tables
-- directly (BKT/mastery state must only change through the engine so the
-- update math stays consistent).
-- ============================================================================

CREATE TABLE IF NOT EXISTS topics (
    topic_id        TEXT PRIMARY KEY,          -- dot-namespaced, e.g. 'dsa.dp.lis'
    domain          TEXT NOT NULL,             -- 'dsa' | 'system_design' | 'web_dev' | 'dbms'
    display_name    TEXT NOT NULL,
    difficulty      SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    -- BKT params, calibrated per topic. Defaults are placeholders until real item stats exist.
    p_init          NUMERIC(5,4) NOT NULL DEFAULT 0.3000,
    p_transit       NUMERIC(5,4) NOT NULL DEFAULT 0.1500,
    p_slip          NUMERIC(5,4) NOT NULL DEFAULT 0.1000,
    p_guess         NUMERIC(5,4) NOT NULL DEFAULT 0.2000,
    -- Optional per-topic override for the forgetting-curve stability constant
    -- (days). NULL = use the difficulty/mastery formula in forgetting_curve.py.
    -- Fill this in per-topic once real reinject-outcome data exists to fit it;
    -- until then every topic falls back to the literature-anchored formula.
    stability_days_override NUMERIC(6,2)
);

CREATE TABLE IF NOT EXISTS prerequisite_edges (
    -- edge: prereq_topic_id is a prerequisite of topic_id (i.e. topic_id depends on prereq_topic_id)
    topic_id        TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    prereq_topic_id TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, prereq_topic_id),
    CHECK (topic_id <> prereq_topic_id)
);
CREATE INDEX IF NOT EXISTS idx_prereq_lookup ON prerequisite_edges (topic_id);

CREATE TABLE IF NOT EXISTS misconceptions (
    misconception_id TEXT PRIMARY KEY,          -- e.g. 'dp.missing_base_case'
    topic_id          TEXT NOT NULL REFERENCES topics(topic_id),
    description       TEXT NOT NULL,
    error_type        TEXT NOT NULL CHECK (error_type IN
                        ('wrong_approach','edge_case_missed','complexity_issue',
                         'off_by_one','syntax','conceptual_gap'))
);

CREATE TABLE IF NOT EXISTS mcq_questions (
    question_id     TEXT PRIMARY KEY,
    topic_id        TEXT NOT NULL REFERENCES topics(topic_id),
    prompt          TEXT NOT NULL,
    difficulty      TEXT NOT NULL DEFAULT 'easy' CHECK (difficulty IN ('easy','intermediate','hard')),
    correct_option_id TEXT NOT NULL
);
ALTER TABLE mcq_questions
    ADD COLUMN IF NOT EXISTS difficulty TEXT NOT NULL DEFAULT 'easy';
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_constraint
        WHERE conname = 'mcq_questions_difficulty_check'
    ) THEN
        ALTER TABLE mcq_questions
            ADD CONSTRAINT mcq_questions_difficulty_check
            CHECK (difficulty IN ('easy','intermediate','hard'));
    END IF;
END $$;
CREATE INDEX IF NOT EXISTS idx_mcq_questions_selection
    ON mcq_questions (topic_id, difficulty);

CREATE TABLE IF NOT EXISTS mcq_options (
    question_id      TEXT NOT NULL REFERENCES mcq_questions(question_id) ON DELETE CASCADE,
    option_id        TEXT NOT NULL,             -- e.g. 'opt_a'
    option_text      TEXT NOT NULL,
    misconception_id TEXT REFERENCES misconceptions(misconception_id),  -- NULL if this is the correct option
    PRIMARY KEY (question_id, option_id)
);

CREATE TABLE IF NOT EXISTS study_materials (
    material_id     TEXT PRIMARY KEY,
    domain          TEXT NOT NULL CHECK (domain IN ('dsa','dbms','system_design','web_dev')),
    topic_id        TEXT,
    title           TEXT NOT NULL,
    material_type   TEXT NOT NULL CHECK (material_type IN ('video','document','article','practice','course','roadmap','reference','visualization','tutorial','documentation')),
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

CREATE TABLE IF NOT EXISTS students (
    student_id      TEXT PRIMARY KEY,
    user_id         UUID REFERENCES users(id) ON DELETE SET NULL, -- Optional FK linking auth user to student
    target_role     TEXT,                       -- 'sde' | 'backend' | 'full_stack' | ...
    timeline_weeks  SMALLINT
);
ALTER TABLE students
    ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES users(id) ON DELETE SET NULL;

CREATE TABLE IF NOT EXISTS mastery_state (
    student_id      TEXT NOT NULL REFERENCES students(student_id),
    topic_id        TEXT NOT NULL REFERENCES topics(topic_id),
    p_mastery       NUMERIC(6,4) NOT NULL DEFAULT 0.0,
    attempts        INT NOT NULL DEFAULT 0,
    last_correct_at TIMESTAMPTZ,
    last_updated    TIMESTAMPTZ NOT NULL DEFAULT now(),
    PRIMARY KEY (student_id, topic_id)
);

CREATE TABLE IF NOT EXISTS attempts (
    attempt_id       BIGSERIAL PRIMARY KEY,
    student_id       TEXT NOT NULL REFERENCES students(student_id),
    topic_id         TEXT NOT NULL REFERENCES topics(topic_id),
    source           TEXT NOT NULL CHECK (source IN ('mcq','code')),
    question_id      TEXT,                      -- mcq_questions.question_id, if source='mcq'
    is_correct       BOOLEAN NOT NULL,
    misconception_id TEXT REFERENCES misconceptions(misconception_id),
    confidence       NUMERIC(4,3),               -- classifier confidence, NULL for mcq (deterministic lookup)
    evidence         TEXT,
    p_mastery_before NUMERIC(6,4),
    p_mastery_after  NUMERIC(6,4),
    created_at       TIMESTAMPTZ NOT NULL DEFAULT now()
);
CREATE INDEX IF NOT EXISTS idx_attempts_student_topic ON attempts (student_id, topic_id, created_at);

CREATE TABLE IF NOT EXISTS reinject_queue (
    student_id      TEXT NOT NULL REFERENCES students(student_id),
    topic_id        TEXT NOT NULL REFERENCES topics(topic_id),
    retention        NUMERIC(5,4) NOT NULL,
    computed_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
    served           BOOLEAN NOT NULL DEFAULT false,
    PRIMARY KEY (student_id, topic_id, computed_at)
);

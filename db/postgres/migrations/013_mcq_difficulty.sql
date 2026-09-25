-- 013_mcq_difficulty.sql
-- Adds difficulty categorization (easy, intermediate, hard) to MCQ questions.

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

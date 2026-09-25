-- 009_mcq_options.sql
-- Each option belongs to a question and can optionally be tagged with a known
-- misconception. The correct option should have misconception_id = NULL.

CREATE TABLE mcq_options (
    question_id          TEXT NOT NULL REFERENCES mcq_questions(question_id) ON DELETE CASCADE,
    option_id            TEXT NOT NULL,
    option_text          TEXT NOT NULL,
    misconception_id     TEXT REFERENCES misconceptions(misconception_id) ON DELETE SET NULL,
    PRIMARY KEY (question_id, option_id)
);

CREATE INDEX idx_mcq_options_question_id ON mcq_options(question_id);
CREATE INDEX idx_mcq_options_misconception_id ON mcq_options(misconception_id);
-- 008_mcq_questions.sql
-- MCQ content is keyed to a topic and stores the question prompt plus the
-- correct option ID; distractors are attached in mcq_options.

CREATE TABLE mcq_questions (
    question_id          TEXT PRIMARY KEY,
    topic_id             TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    prompt               TEXT NOT NULL,
    correct_option_id    TEXT NOT NULL
);

CREATE INDEX idx_mcq_questions_topic_id ON mcq_questions(topic_id);
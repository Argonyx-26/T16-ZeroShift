-- 003_prerequisite_edges.sql
-- Self-referencing edge table over topics; the hand-curated DAG that the
-- root-cause tracer traverses backward to find the earliest weak ancestor.
-- One row per direct dependency: topic_id depends on prereq_topic_id.

CREATE TABLE prerequisite_edges (
    topic_id          TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    prereq_topic_id   TEXT NOT NULL REFERENCES topics(topic_id) ON DELETE CASCADE,
    PRIMARY KEY (topic_id, prereq_topic_id),
    CHECK (topic_id <> prereq_topic_id)
);

CREATE INDEX idx_prerequisite_edges_prereq ON prerequisite_edges(prereq_topic_id);
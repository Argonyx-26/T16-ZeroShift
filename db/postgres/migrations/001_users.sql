-- 001_topics.sql
-- Root table -- matches DAG node IDs from stat-models-io-contract.md.
-- Topic IDs are dot-namespaced strings such as "dsa.dp.knapsack".
-- p_init/p_transit/p_slip/p_guess are the per-topic BKT params; the
-- stability_days_override lets a topic override the forgetting-curve's
-- calibrated base_stability constant.

CREATE TABLE topics (
    topic_id                    TEXT PRIMARY KEY,
    domain                      TEXT NOT NULL,
    display_name                TEXT NOT NULL,
    difficulty                  SMALLINT NOT NULL CHECK (difficulty BETWEEN 1 AND 5),
    p_init                      NUMERIC(5,4),
    p_transit                   NUMERIC(5,4),
    p_slip                      NUMERIC(5,4),
    p_guess                     NUMERIC(5,4),
    stability_days_override     NUMERIC
);

CREATE INDEX idx_topics_domain ON topics(domain);
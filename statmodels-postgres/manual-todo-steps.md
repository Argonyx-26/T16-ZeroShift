# Your Manual To-Do List — Stat Models (5.1, 5.2, 5.3, 5.6)

Everything code-level is done and verified. These are the things only you can do
(decisions, real data, credentials, coordination with teammates).

## 1. Pick one engine and tell your team
Postgres and Neo4j versions are functionally identical (same API contract). Postgres
is the one I actually ran end-to-end here — it works, confirmed with real HTTP calls.
Neo4j has the same code (including today's onboarding fix) but I couldn't run a live
Neo4j server in this environment to prove it. **Before you commit to Neo4j for the
demo**, run its own smoke test yourself (steps below) — don't assume it works just
because Postgres did.

## 2. Send the frontend person `stat-models-api-contract-FINAL.md`
This is the one file — every endpoint, every request/response shape, error codes,
and a worked end-to-end example. Nothing else needed from you for that handoff.

## 3. Replace the placeholder seed data with real curriculum content
`scripts/seed.py` currently has a small made-up DSA slice (8 topics, a couple of MCQs)
just to prove the pipeline works. You need to replace it with real content:
- Real topic list across DSA / system design / web dev / DBMS, with difficulty ratings
- Real prerequisite edges between them (this is the DAG — it's hand-curated by design,
  there's no way to auto-generate a good one)
- Real MCQ questions, with every wrong option tagged with a specific misconception_id
  (this tagging is what makes 5.1 work — untagged wrong answers can't be diagnosed)
- Real misconception descriptions

This is content work, not code work — I can't invent your curriculum for you.

## 4. Calibrate BKT and forgetting-curve constants (or explicitly punt on this for the demo)
Every topic still uses the same flat BKT parameters (p_init=0.3, p_transit=0.15,
p_slip=0.1, p_guess=0.2) — those are still uncalibrated placeholders, unchanged.

The forgetting-curve constants (`app/forgetting_curve.py`) were updated: they're now
anchored to published spaced-repetition intervals for practiced/meaningful material
(2-6 week first-stable-interval range) instead of an arbitrary guess — see that file's
docstring for the reasoning. This is a real improvement (defensible in judge Q&A as
"grounded in the literature"), but it is **still not the same as being calibrated on
this app's own students** — that requires weeks of actual reinject-queue outcomes
(did the student still get it right when re-served the question?) that don't exist yet.
Two honest options for judge Q&A, updated:
- Say plainly it's a literature-grounded designed mechanism, not validated on this
  app's own usage data yet (matches the project doc's own "what's proven vs future
  work" framing — you don't need to hide this)
- If you have any real attempt data (even a small pilot), fit `p_slip`/`p_guess` per
  BKT topic, and set `topics.stability_days_override` per topic for the forgetting
  curve, before the demo — both are now one-column edits, no code changes needed.

## 5. Decide `USE_LLM_DIAGNOSIS` for the demo
Default is `false` — code diagnosis runs on the rule-based heuristic, zero API cost,
zero network dependency, fully demoable offline. If you want the real LLM classifier
live during the demo, you need to set `ANTHROPIC_API_KEY` yourself — that's a secret
I can't set for you.

## 6. Run the Neo4j build's own smoke test before demo day
```bash
docker compose up -d          # starts Neo4j (see docker-compose.yml)
cat db/schema.cypher | cypher-shell -u neo4j -p statmodels_dev_pw
pip install -r requirements.txt
PYTHONPATH=. python3 scripts/seed.py
PYTHONPATH=. uvicorn app.main:app --port 8001
# separately:
PYTHONPATH=. python3 scripts/demo_trace.py
```
If anything errors, that's a real bug to fix before relying on this build — I have
not been able to test it myself here.

## 7. Coordinate the actual boundary with your teammates
Your stat-models service only calls `/diagnose/code` correctly if someone else's
service has already run the student's code against test cases and static analysis
and handed you the results — that's explicitly out of scope for this module (see
`app/misconceptions.py`'s docstring). Confirm who owns that step and what shape their
output is in, so it matches this contract's `test_results`/`static_analysis` fields.

## 8. Onboarding UX decision
The `/onboarding/diagnostic` endpoint I built assumes the frontend collects a batch of
diagnostic-quiz answers and submits them all in one call after the student finishes
the quiz (not one call per question). Confirm that matches how your onboarding screen
is actually built — if it's meant to submit question-by-question instead, tell me and
I'll add a lighter-weight per-question variant.

---

## Quick reference — what's fully done vs. what needs you

| Item | Status |
|---|---|
| BKT engine (5.1 support) | ✅ Done, tested live |
| Misconception diagnosis, MCQ + code paths (5.1) | ✅ Done, tested live |
| Prerequisite-graph root-cause tracer (5.2) | ✅ Done, tested live |
| Forgetting-curve scheduler (5.3) | ✅ Done, tested live |
| Onboarding diagnostic endpoint (5.6) | ✅ Built + fixed a bug + tested live (Postgres) |
| Neo4j build of all of the above | ⚠️ Code complete, not run against a live server |
| Real curriculum data (topics/DAG/MCQs) | ❌ Your job — currently placeholder |
| BKT/forgetting-curve calibration | ❌ Your job — currently flat defaults |
| LLM classifier API key | ❌ Your job — if you want it live for demo |
| Code-execution/static-analysis upstream service | ❌ Someone else's module — confirm handoff shape |

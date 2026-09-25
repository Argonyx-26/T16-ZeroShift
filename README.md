# Team ZeroShift #

Contributors: 

Maneesha029
Nimish-Sharma-Dev
dabhishek9035-ui
Sup1612



# Adaptive Learning & Knowledge Gap Identification System
### Project Description v2 — Kalpavikas 2.0, PS2

---

## 1. Problem Statement

Develop an intelligent learning system that continuously analyzes student responses to identify individual knowledge gaps, learning levels, and misconceptions, and dynamically provides personalized learning resources, targeted interventions, and adaptive assessments.

## 2. The Gap in Existing Work

Published 2026 academic systems (ALIGNAgent, GenMentor, CoderAgent, EduPlanner) and commercial interview-prep tools (LeetCode, GFG, InterviewBit) already do topic-level proficiency tracking and problem recommendation. What they consistently miss:

- No explanation of *why* a learner is weak on a topic, only *that* they are (a wrong-answer count, not a diagnosis)
- No forgetting/decay modeling — once a topic is "done," it's never revisited unless the learner manually chooses to
- Mismatched or generic resource recommendations, not tied to the *specific* misconception
- No causal tracing across topics — struggling with graph algorithms is often actually a weak-arrays/weak-recursion problem from weeks earlier, never traced back
- No generation of new practice content — only retrieval from a fixed problem bank
- No live, in-the-moment help while a learner is actually coding or studying — everything is retrospective (you find out you're wrong after submitting)
- No accountability layer for the single biggest failure mode of self-paced interview prep: procrastination and doom-scrolling instead of studying

This project is built around closing exactly these gaps.

---

## 3. Target Audience

**College students preparing for tech interviews** — specifically those studying DSA, system design/architecture, web development, and DBMS for placement season or off-campus interviews. This is a well-defined, motivated, tech-comfortable audience with a hard deadline (placement drives, interview calls) and a known failure mode: they know *what* to study (DSA, SD, DBMS, web dev — every prep guide says the same four things) but struggle with knowing *what they personally are weak at*, staying consistent, and getting unstuck without a mentor on hand.

### Why them, over existing tools

| Existing tool | What it does | What it misses |
|---|---|---|
| LeetCode / GFG / InterviewBit | Large problem banks, some topic tagging | No diagnosis of *why* you keep failing a pattern, no forgetting-curve revision, no live in-IDE help, no accountability for actually sitting down to study |
| YouTube/course platforms (Striver, Love Babbar sheets, etc.) | Structured curriculum | One-size-fits-all order — doesn't adapt to what *you* specifically are weak at, no diagnosis, no companion while you practice |
| Generic AI coding assistants (Copilot, ChatGPT) | Code help, explanations on demand | Reactive only — you have to know to ask. Doesn't proactively catch a logic error, doesn't track your recurring misconceptions over time, doesn't know your interview-prep goals |

**Positioning statement:** Every other tool either hands you a giant problem list and assumes you'll self-diagnose and stay disciplined, or answers your question only when you already know to ask it. This system diagnoses *why* you're stuck, keeps mastered topics from quietly decaying before your actual interview, and sits with you while you work instead of waiting for you to come to it.

---

## 4. System Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        DATA INGESTION LAYER                      │
│  Quiz/MCQ responses | Code submissions | IDE activity |          │
│  Study session activity | Peer-group interaction                 │
└───────────────────────────────┬───────────────────────────────────┘
                                 │
                 ┌───────────────┼────────────────┐
                 ▼               ▼                ▼
        ┌────────────────┐┌──────────────┐┌──────────────────┐
        │ Misconception   ││  Forgetting  ││  Onboarding /      │
        │ Diagnosis Agent ││  Curve Agent ││  Level Assessment  │
        └────────┬────────┘└──────┬───────┘└─────────┬─────────┘
                 │                │                   │
                 │        ┌───────┴────────┐          │
                 ▼        ▼                ▼          ▼
        ┌────────────────────┐    ┌──────────────────────────┐
        │ Prerequisite-Graph   │    │  Verified Resource /       │
        │ Root-Cause Tracer    │    │  Adaptive Item Generator   │
        └──────────┬──────────┘    └─────────────┬─────────────┘
                    │                             │
                    └──────────┬──────────────────┘
                               ▼
                  ┌──────────────────────────┐
                  │  Peer-Group Matching &     │
                  │  Engagement Scoring Agent  │
                  └────────────┬────────────────┘
                               ▼
                  ┌──────────────────────────────┐
                  │  Floating AI Study Companion   │
                  │  (desktop overlay + IDE hook)  │
                  └──────────────────────────────┘
```

The companion sits at the top of the stack because it's the surface layer the learner actually interacts with day-to-day — everything below feeds it context, and it feeds usage data back down to sharpen diagnosis and recommendations.

---

## 5. Feature Set

### 5.1 Root-Cause Misconception Diagnosis
Every MCQ/conceptual-question distractor is pre-tagged with a misconception label at content-creation time (e.g., "confuses BFS queue with DFS stack," "off-by-one in binary search bounds," "thinks a LEFT JOIN drops unmatched left rows"). When a learner repeatedly triggers the same label across different questions, that label — not the topic — is surfaced as the gap. For code submissions (DSA problems), static analysis plus an LLM pass, constrained to a structured `{concept, error_type, evidence}` output, classifies *why* a solution failed — wrong approach, edge case missed, time-complexity issue, off-by-one — not just pass/fail.

### 5.2 Prerequisite-Graph Root-Cause Tracing
A hand-curated prerequisite DAG across DSA, system design, web dev, and DBMS (e.g., recursion → backtracking → DP; normalization → joins → query optimization) lets the system trace a surface-level gap back to its true origin. A learner failing dynamic programming problems might actually have an unresolved recursion gap from weeks earlier — the system flags the earliest unmastered prerequisite node, not just the topic currently failing.

### 5.3 Forgetting-Curve-Aware Revision
Once a topic is marked "mastered," it isn't dropped. A simplified Ebbinghaus/SM-2-style decay function, parameterized by initial mastery confidence, topic difficulty, and time since last correct application, predicts retention. When predicted retention drops below a threshold, one low-stakes question or problem on that topic is silently re-injected into the next practice session — directly solving the real interview-prep failure mode of "I did graphs in week 2, it's week 10 now, and I've forgotten everything."

### 5.4 Verified Resource Recommendation
Before any resource is shown, three automated checks run: link liveness, content-relevance match (embedding similarity between resource text and the *specific misconception*, not just the topic name — e.g., a segment-tree misconception gets a segment-tree explainer, not a generic trees video), and freshness. A small internally-curated resource bank (Striver's sheet, NeetCode, official docs, etc.) acts as fallback so recommendations never break live. A confidence score is shown alongside each recommendation.

### 5.5 Adaptive Item Generation
When the resource/problem bank has nothing well-matched to a specific misconception, an LLM-based item generator — constrained to a structured template and difficulty-calibrated against past item statistics — produces a fresh practice problem or conceptual question targeting that exact gap, rather than only retrieving pre-existing content.

### 5.6 Personalized Onboarding
On first use, a short set of questions (target role — SDE/backend/full-stack, timeline to interviews, self-rated comfort per subject) plus a brief diagnostic quiz per subject determines the learner's starting point. Instead of dropping everyone into the same "Day 1: Arrays" sequence, the initial content plan is built around what this learner actually needs — someone strong in DSA but weak in DBMS gets a different first week than someone starting from zero.

### 5.7 Peer Study Groups with Engagement Scoring
Learners currently working on the same topic are pooled into a peer group where they can ask questions, share approaches, and help each other debug. Activity that reflects genuine engagement — answering a peer's question, explaining an approach, helping someone else get unstuck — feeds an engagement score, separate from raw proficiency, that reflects how actively someone is *learning* versus just consuming content. This score can weight things like being surfaced as a suggested peer-helper for a topic, or unlocking a "mentor" role in the group. This replaces a topic-only leaderboard with one that rewards actually helping, not just solving problems fastest.

### 5.8 Floating AI Study Companion
A designed cartoon-mascot companion that runs as a small floating overlay on the learner's screen while they study or code — the centerpiece differentiator of the project.

**What it does:**
- **In the IDE (VS Code extension):** watches for syntax and logic issues as the learner codes, and instead of silently fixing or flagging errors, nudges with Socratic questions — *"are you sure this is the right approach for this constraint?"*, *"want help understanding why this loop doesn't terminate?"* — prompting the learner to think rather than just handing over the answer.
- **Concept help on demand:** for system design, web dev, and DBMS topics, the companion can walk through a concept via short prompts and follow-up questions rather than a wall of text, adapting to what the learner already seems to know.
- **Focus support:** gently notices patterns associated with distraction (e.g., long stretches away from the IDE/study app during a planned study session) and nudges the learner back — a check-in, not a lockout. This is opt-in and transparent about exactly what's being tracked, since anything screen-adjacent needs explicit consent and a clear "here's exactly what I look at" explanation to be trustworthy.
- **Feeds the platform:** every interaction (what the learner got stuck on, what kind of nudge helped, what they ignored) flows back into the misconception diagnosis and resource recommendation pipeline, making the system's model of the learner sharper the more they use it.

**Scope note for a one-month build:** a full always-on-top Electron overlay plus a VS Code extension is a real scope — for the demo, prioritize the VS Code extension (most concretely useful, easiest to demo live: write buggy code, watch the companion catch it and ask a Socratic question) and treat the always-visible desktop mascot / focus-nudging as a stretch goal or a simplified browser-extension version if time allows.

---

## 6. User Experience

### 6.1 Onboarding
A learner signs up, answers a handful of questions about their target role and timeline, takes a short diagnostic per subject, and lands on a starting plan built around their actual gaps — not a generic Day 1.

### 6.2 Studying / Practicing
Working through DSA problems, system design questions, or DBMS concepts, the companion is present in the background. If they write a logic error in VS Code, instead of a red squiggly and silence, they get: *"Hmm, are you sure this handles the case where the array is empty?"* If they've been idle or off-task for a while mid-session, a gentle nudge back in, not a guilt-trip.

### 6.3 Getting a Result
Instead of "3/10 wrong on Dynamic Programming," they see something like: *"You're consistently missing the base case in recursive solutions before moving to memoization — this showed up in 3 of your last 4 DP attempts, and traces back to a gap in your recursion fundamentals from two weeks ago."* Specific, causal, not just a score.

### 6.4 What Happens Next
The next practice set quietly includes a question targeting that exact gap. Weeks later, once "mastered," a single low-stakes question resurfaces from the forgetting-curve scheduler to check it's stuck — timed so it doesn't fade right before the actual interview.

### 6.5 Peer Group
The learner sees others currently on the same topic, can ask or answer questions, and their engagement score reflects genuine participation — not just problems solved. Consistently active helpers get visibly recognized as go-to peers for that topic.

---

## 7. Suggested Tech Stack

| Layer | Tool |
|---|---|
| Diagnostic/agent orchestration | Python + a lightweight agent framework (LangGraph or plain function-calling) |
| Knowledge tracing baseline | Simple Bayesian Knowledge Tracing (interpretable, fast, no GPU needed) |
| Misconception tagging (MCQ/conceptual) | Rule-based distractor mapping + LLM fallback for free text |
| Misconception tagging (code submissions) | Static analysis / linting + LLM pass with structured output, constrained to `{concept, error_type, evidence}` |
| Prerequisite-graph tracing | Hand-curated DAG for DSA / system design / web dev / DBMS, backward graph traversal |
| Adaptive item generation | LLM with structured template + difficulty calibration against item stats |
| Resource verification | requests/BeautifulSoup for liveness + embedding similarity (sentence-transformers) |
| Onboarding / diagnostic assessment | Short adaptive quiz per subject, rule-based routing into initial plan |
| Peer-group matching & engagement scoring | Backend service clustering by current topic; scoring weighted by help-given, not just problems solved |
| Main web platform | React/Next.js frontend, Node/Python API backend, Postgres for user data and progress |
| IDE companion | VS Code Extension API, hooking into the Language Server Protocol for live diagnostics, LLM calls for Socratic prompts |
| Desktop overlay (stretch goal) | Electron always-on-top transparent window hosting an animated mascot (Lottie/Rive) |
| Companion animation | Lottie or Rive for a lightweight animated character, not a heavy 3D asset |

---

## 8. What's Proven vs. What's Future Work

Honest framing for demo/judge Q&A:

- **Proven in a one-month build**: the diagnostic pipeline (MCQ + code submission analysis), prerequisite tracing on a hand-curated DAG, resource verification, adaptive item generation, onboarding flow, peer-group matching with basic engagement scoring, and a working VS Code companion extension demoing live Socratic error-catching on a sample coding session.
- **Designed but not fully validated at this stage**: the forgetting-curve recalibration needs real longitudinal usage data across weeks to validate — for the demo it runs on the designed mechanism with a short/simulated window, not proven retention results. The always-visible desktop overlay and focus/doom-scroll nudging is a larger build (screen-activity monitoring, cross-platform overlay) and is explicitly scoped as a stretch goal or simplified prototype, not a fully shipped feature, for a one-month timeline.

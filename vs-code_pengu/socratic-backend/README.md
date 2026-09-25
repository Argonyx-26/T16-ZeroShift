# socratic-backend

The real `/diagnose` endpoint. The VS Code extension posts the current
document to this server every 5s (whenever you pause typing) and
immediately after a failed test run. This server reviews it with
`qwen2.5-coder:7b` running locally via [Ollama](https://ollama.com) and
prints everything it does to the terminal as it happens.

## Setup

```bash
# 1. Install Ollama if you haven't: https://ollama.com/download
# 2. Pull the model (one-time, ~4.7GB)
ollama pull qwen2.5-coder:7b

# 3. Install and run this server
cd socratic-backend
npm install
npm start
```

`ollama serve` usually starts automatically after install; if `npm start`
logs a "fetch failed" error, run `ollama serve` in another terminal first.

## What you'll see in the terminal

```
[3:04:05 PM] Socratic backend listening on http://127.0.0.1:8000
[3:04:05 PM] Using Ollama at http://127.0.0.1:11434, model "qwen2.5-coder:7b"
[3:04:05 PM] Logging triggered/reviewed instances to .../misconception_instances.log
[3:04:11 PM] POST /diagnose  lang=javascript  chars=120  hash=bcfb12ff
[3:04:11 PM]   -> rule-based hints: off-by-one, missing-edge-case
[3:04:12 PM]   -> qwen2.5-coder:7b says trigger=true (off-by-one): "What happens on the last loop iteration when i equals arr.length?"
```

If the code hasn't changed since the last check, it skips the model call
entirely and says so:

```
[3:04:16 PM] POST /diagnose  lang=javascript  chars=120  hash=bcfb12ff
[3:04:16 PM]   -> unchanged since last review, skipping model call
```

## Point the extension at this server

Already the default in the extension's `package.json`
(`socraticCompanion.backendUrl` = `http://127.0.0.1:8000`). If you changed
it, reset it in VS Code settings, or set `socraticCompanion.backendUrl` to
empty to force the extension back onto its own local regex fallback
(useful for testing that fallback path in isolation, or if the network/
Ollama isn't available on demo day).

## Config (env vars)

| Var | Default | Purpose |
|---|---|---|
| `PORT` | `8000` | Port this server listens on. |
| `OLLAMA_URL` | `http://127.0.0.1:11434` | Where Ollama is running. |
| `MODEL` | `qwen2.5-coder:7b` | Ollama model tag to call. |
| `AUTH_TOKEN` | *(empty)* | If set, `/diagnose` requires `Authorization: Bearer <token>`. Empty = disabled. Matches the `socraticCompanion.authToken` setting once the OAuth handshake work lands. |

Example: `PORT=8001 MODEL=qwen2.5-coder:7b npm start`

## `misconception_instances.log`

Every reviewed (non-skipped) request appends a JSON line here:

```json
{"timestamp":"...","code_hash":"...","language":"javascript","rule_hints":["off-by-one"],"trigger":true,"misconception_tag":"off-by-one","question":"..."}
```

This is a stand-in for the eventual Postgres `misconception_instances`
table (handoff item #2) — same fields, just appended to a file instead of
inserted into a DB, so nothing about the log format needs to change once
Postgres is wired up.

## Still open

- **Postgres**, instead of the JSON-lines log above.
- **Nudge accept/dismiss persistence** — the desktop app's buttons don't
  POST anywhere yet; once they do, this server needs a place to record
  `ide_sessions.companion_nudges_accepted`.
- **Real auth** — `AUTH_TOKEN` is a single shared secret for now, not the
  OAuth handshake described in the original handoff.

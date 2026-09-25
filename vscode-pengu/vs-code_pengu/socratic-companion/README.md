# socratic-companion (VS Code extension)

Watches you code and, when it spots a likely logic bug, nudges the
`desktop-companion` mascot app with a Socratic question — never the answer.
Pairs with the already-built Electron pet over `http://127.0.0.1:4123`.

## Setup

```bash
npm install
```

Press **F5** (or Run ▸ Run Extension) to launch an Extension Development
Host with the extension loaded. `.vscode/tasks.json` runs `tsc -watch` as
the build task automatically.

## Try it end-to-end

1. Start the desktop companion first: `npm start` in `../desktop-companion`.
2. F5 here to launch the Dev Host.
3. Run **Socratic Companion: Send Test Nudge** from the command palette to
   confirm the wiring — the mascot should flash to alert and show a bubble.
4. Then try a real trigger. In a `.js`/`.ts` file, type something like:
   ```js
   function sumUntilLimit(arr, limit) {
     let total = 0;
     for (let i = 0; i <= arr.length; i++) {
       total += arr[i];
       if (total >= limit) {
         break;
       }
     }
     return total;
   }
   ```
   and pause. That closing `}` flips the brace balance back to zero (a
   "meaningful chunk completed"), and `i <= arr.length` matches the
   off-by-one fallback pattern, so a nudge should fire within ~5s.

## Configuration

Settings live under `socraticCompanion.*` (Settings UI or `settings.json`):

| Setting | Default | Purpose |
|---|---|---|
| `socraticCompanion.backendUrl` | `""` | Real `/diagnose` backend base URL. Empty = always use the local fallback regex patterns. |
| `socraticCompanion.authToken` | `""` | Bearer token sent to the backend. Placeholder until the OAuth handshake lands. |
| `socraticCompanion.failedTestThreshold` | `2` | Consecutive failed test runs that force a nudge check even without a chunk boundary. |

## How the trigger logic works

A nudge is only *considered* when:
- a meaningful chunk just completed (brace balance flips unbalanced→balanced,
  or in Python a `def` block's indentation closes), **or**
- the failed-test counter has reached `failedTestThreshold`

**and** the session isn't already "good" (`SessionTracker.isSessionGood()` —
no recent failed tests and a low average diagnostics count). Edits are
debounced 5s so analysis only runs once typing pauses; a 20s heartbeat pings
the desktop app's `/health` endpoint (logged to the "Socratic Companion"
output channel) just to confirm it's reachable.

When a nudge is warranted, `DiagnosisClient` calls the real backend's
`POST /diagnose` if `backendUrl` is set, and falls back to local regex
patterns (off-by-one, infinite loop, missing base case, missing edge case,
loose equality) on any failure, timeout, or missing config — so a demo
never depends on the network or a backend being up.

## Still open (matches the project handoff)

1. **Real backend `/diagnose`** — not built in this pass. This extension
   works fully on the local fallback in the meantime.
2. **Nudge response persistence** — desktop app's accept/dismiss buttons
   still need to POST back somewhere once a backend exists.
3. **Auth token wiring** — `authToken` is a plain setting for now; swap for
   `context.secrets` once the OAuth handshake is ready.
4. **Fallback pattern tuning** — the five patterns above are generic;
   tune/add one that's guaranteed to fire on whatever snippet the live
   demo actually uses.
5. Desktop pet position persistence (lives in `desktop-companion`, not
   this repo) — unchanged, still a nice-to-have.

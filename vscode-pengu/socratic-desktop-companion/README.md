# Socratic Study Companion — Desktop Pet

This is the actual floating mascot — a standalone Electron app that sits on
your desktop (like Desktop Mate), always-on-top, draggable, transparent
background. It's separate from VS Code entirely; the VS Code extension just
sends it events over localhost.

## Setup (2 minutes)

1. Copy your three mascot images into this folder's `media/` directory as:
   - `mascot-idle.png`
   - `mascot-thinking.png`
   - `mascot-alert.png`
   (Same images you already used for the old VS Code webview version — reuse them here.)

2. Install and run:

```bash
npm install
npm start
```

A small transparent window appears in the bottom-right of your screen with
your mascot floating in it. Click-drag it anywhere on screen — dragging works
because the whole window has `-webkit-app-region: drag` applied.

## How it receives events

It runs a tiny local HTTP server on `127.0.0.1:4123` (not reachable from
outside your machine):

- `POST /nudge` with `{ question, misconception_tag }` → shows the speech
  bubble and switches to the alert pose
- `POST /mood` with `{ mood: "idle" | "thinking" | "alert" }` → switches pose
  without showing a bubble
- `GET /health` → `{ status: "ok" }`, useful to confirm it's running

The VS Code extension (`/socratic-companion`) calls these automatically — you
don't need to trigger them manually. To test it's alive on its own:

```bash
curl -X POST http://127.0.0.1:4123/nudge \
  -H "Content-Type: application/json" \
  -d '{"question":"Are you sure this handles an empty array?","misconception_tag":"edge-case-missed"}'
```

You should see the bubble pop up immediately.

## Packaging into a real installable app (only if you have time)

For the hackathon demo, `npm start` is enough — you don't need to package it.
If you want a double-clickable app afterward, add `electron-builder` and run
its `build` script; not worth the setup time during the event itself.

## Notes on this architecture choice

VS Code Webviews are sandboxed *inside* the VS Code window — they cannot
render as an OS-level overlay outside it. A real desktop pet has to be a
separate process. This is why the mascot is now its own Electron app rather
than part of the extension: the extension detects things (it has direct
access to your code), the desktop app displays things (it has access to the
whole screen). They talk to each other over localhost instead of being the
same program.

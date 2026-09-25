'use strict';

/**
 * socratic-backend
 * -----------------
 * Real implementation of the `/diagnose` endpoint the VS Code extension
 * calls at every 5s debounce interval. Every request, hint, model reply and
 * decision is printed to this process's terminal as it happens -- that's
 * the "reflects on the terminal" behavior.
 *
 * Pipeline per request:
 *   1. Skip if the code is identical to the last request (nothing changed).
 *   2. Skip if there's too little code yet to judge (still mid-thought).
 *   3. Run cheap rule-based checks -- not a verdict, just hints fed to the
 *      model as extra context so it doesn't have to spot everything cold.
 *   4. Call qwen2.5-coder:7b via Ollama with a strict JSON-only prompt.
 *   5. Validate the shape of what comes back; never forward malformed JSON
 *      to the extension.
 *   6. Append an entry to misconception_instances.log -- a JSON-lines
 *      stand-in for the eventual Postgres `misconception_instances` table.
 *
 * Run:
 *   ollama pull qwen2.5-coder:7b
 *   npm install
 *   npm start
 */

const express = require('express');
const crypto = require('crypto');
const fs = require('fs');
const path = require('path');

const PORT = process.env.PORT || 8000;
const OLLAMA_URL = process.env.OLLAMA_URL || 'http://127.0.0.1:11434';
const MODEL = process.env.MODEL || 'qwen2.5-coder:7b';
const AUTH_TOKEN = process.env.AUTH_TOKEN || ''; // optional; empty = auth disabled
const LOG_FILE = path.join(__dirname, 'misconception_instances.log');

const app = express();
app.use(express.json({ limit: '1mb' }));

// In-memory dedup: skip re-analyzing code that hasn't changed since the
// last request, so the 5s interval doesn't hammer Ollama while you're
// staring at unchanged code.
let lastHash = null;

// --- rule-based pre-check -------------------------------------------------
// Cheap hints only -- they seed the prompt, they don't decide the outcome.
const RULE_HINTS = [
  { tag: 'off-by-one', test: (c) => /<=\s*[\w.]+\.length\b/.test(c) },
  { tag: 'infinite-loop', test: (c) => /while\s*\(\s*true\s*\)/.test(c) && !/\bbreak\b/.test(c) },
  { tag: 'loose-equality', test: (c) => /[^=!<>]==[^=]/.test(c) },
  {
    tag: 'missing-edge-case',
    test: (c) =>
      /function\s+\w+\s*\(/.test(c) &&
      !/(length\s*===?\s*0|isEmpty|=== *null|=== *undefined)/.test(c)
  }
];

function ruleBasedHints(code) {
  return RULE_HINTS.filter((r) => r.test(code)).map((r) => r.tag);
}

// --- LLM call --------------------------------------------------------------
const SYSTEM_PROMPT = `You are a Socratic coding tutor embedded in a live-coding study tool.
You will be shown a snippet of code a student is actively writing. Decide if
it currently contains a likely logic bug, and if so, ask ONE short Socratic
question that leads the student toward finding it themselves -- never state
the bug or the fix directly.

Respond with ONLY a JSON object, no prose, no markdown fences, matching
exactly this shape:
{"trigger": boolean, "question": string, "misconception_tag": string}

Rules:
- "trigger" is true only if you're fairly confident there's a real bug.
- If the code looks fine, or is too incomplete to judge, set "trigger" to
  false and leave "question" and "misconception_tag" as empty strings.
- "question" must be a single question, under 25 words, and must never
  reveal the fix or name the exact line/variable that's wrong.
- "misconception_tag" is a short kebab-case label for the bug category
  (e.g. "off-by-one", "missing-edge-case", "infinite-loop",
  "missing-base-case", "loose-equality", or another short label if none of
  those fit).`;

async function callOllama(code, language, hints) {
  const userContent = [
    `Language: ${language}`,
    hints.length ? `Rule-based hints (unconfirmed, for context only): ${hints.join(', ')}` : '',
    'Code:',
    '```',
    code,
    '```'
  ]
    .filter(Boolean)
    .join('\n');

  const res = await fetch(`${OLLAMA_URL}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model: MODEL,
      stream: false,
      format: 'json',
      options: { temperature: 0.2 },
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: userContent }
      ]
    })
  });

  if (!res.ok) {
    throw new Error(`Ollama returned HTTP ${res.status} -- is "ollama serve" running?`);
  }
  const data = await res.json();
  const raw = data && data.message && data.message.content;
  if (!raw) {
    throw new Error('Ollama response was missing message.content');
  }
  return raw;
}

function parseAndValidate(raw) {
  let parsed;
  try {
    parsed = JSON.parse(raw);
  } catch {
    throw new Error(`model did not return valid JSON: ${raw.slice(0, 200)}`);
  }
  if (
    typeof parsed.trigger !== 'boolean' ||
    typeof parsed.question !== 'string' ||
    typeof parsed.misconception_tag !== 'string'
  ) {
    throw new Error(`model JSON missing required fields: ${raw.slice(0, 200)}`);
  }
  return parsed;
}

// --- terminal logging + instance log ---------------------------------------
function logLine(msg) {
  const ts = new Date().toLocaleTimeString();
  console.log(`[${ts}] ${msg}`);
}

function appendInstanceLog(entry) {
  fs.appendFile(LOG_FILE, JSON.stringify(entry) + '\n', (err) => {
    if (err) logLine(`WARN: failed to write ${LOG_FILE}: ${err.message}`);
  });
}

// --- routes ------------------------------------------------------------
app.post('/diagnose', async (req, res) => {
  if (AUTH_TOKEN) {
    const header = req.headers.authorization || '';
    if (header !== `Bearer ${AUTH_TOKEN}`) {
      logLine('401 -- missing/invalid auth token');
      return res.status(401).json({ error: 'unauthorized' });
    }
  }

  const { code, language } = req.body || {};
  if (typeof code !== 'string') {
    return res.status(400).json({ error: 'body must include a "code" string' });
  }

  const hash = crypto.createHash('sha1').update(code).digest('hex');
  logLine(`POST /diagnose  lang=${language || 'unknown'}  chars=${code.length}  hash=${hash.slice(0, 8)}`);

  if (hash === lastHash) {
    logLine('  -> unchanged since last review, skipping model call');
    return res.json({ trigger: false, question: '', misconception_tag: '' });
  }
  lastHash = hash;

  const nonBlankLines = code
    .trim()
    .split('\n')
    .filter((l) => l.trim()).length;
  if (nonBlankLines < 2) {
    logLine('  -> too little code yet to judge, skipping model call');
    return res.json({ trigger: false, question: '', misconception_tag: '' });
  }

  const hints = ruleBasedHints(code);
  if (hints.length) {
    logLine(`  -> rule-based hints: ${hints.join(', ')}`);
  }

  try {
    const raw = await callOllama(code, language || 'unknown', hints);
    const result = parseAndValidate(raw);
    logLine(
      `  -> ${MODEL} says trigger=${result.trigger}` +
        (result.trigger ? ` (${result.misconception_tag}): "${result.question}"` : '')
    );

    appendInstanceLog({
      timestamp: new Date().toISOString(),
      code_hash: hash,
      language: language || 'unknown',
      rule_hints: hints,
      trigger: result.trigger,
      misconception_tag: result.misconception_tag,
      question: result.question
    });

    res.json(result);
  } catch (err) {
    logLine(`  -> ERROR calling ${MODEL} via Ollama: ${err.message}`);
    logLine(`  -> check: is "ollama serve" running, and has "ollama pull ${MODEL}" finished?`);
    res.status(502).json({ error: 'diagnosis failed', detail: err.message });
  }
});

app.get('/health', (_req, res) => res.json({ ok: true, model: MODEL }));

app.listen(PORT, () => {
  logLine(`Socratic backend listening on http://127.0.0.1:${PORT}`);
  logLine(`Using Ollama at ${OLLAMA_URL}, model "${MODEL}"`);
  logLine(`Logging triggered/reviewed instances to ${LOG_FILE}`);
});

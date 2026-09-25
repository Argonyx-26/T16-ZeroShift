const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

const PORT = 4123;
const BACKEND_URL = process.env.BACKEND_URL || 'http://127.0.0.1:8000';
let mainWindow;

// Store the last nudge + code context so we can request an explanation
// when the student clicks "Help me understand".
let lastNudgeContext = null;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 360,
    height: 380,
    x: Math.max(0, width - 380),
    y: Math.max(0, height - 420),
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: false,   // show in taskbar so user can find and focus window
    resizable: false,
    hasShadow: false,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
    },
  });

  // 'screen-saver' level keeps it above fullscreen apps too, not just normal windows.
  mainWindow.setAlwaysOnTop(true, 'screen-saver');
  mainWindow.loadFile(path.join(__dirname, 'renderer', 'index.html'));
  mainWindow.show();
  mainWindow.focus();
}

/**
 * Local-only HTTP server the VS Code extension POSTs to. No auth needed since
 * it only binds to 127.0.0.1 — nothing outside this machine can reach it.
 */
function startLocalServer() {
  const server = http.createServer((req, res) => {
    if (req.method === 'POST' && (req.url === '/nudge' || req.url === '/mood')) {
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          const channel = req.url === '/nudge' ? 'nudge' : 'mood';

          // Capture the nudge context so /explain has something to work with
          if (channel === 'nudge') {
            lastNudgeContext = {
              ...lastNudgeContext,
              question: payload.question,
              misconception_tag: payload.misconception_tag,
            };
          }

          if (mainWindow) mainWindow.webContents.send(channel, payload);
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
        }
      });
    } else if (req.method === 'POST' && req.url === '/context') {
      // The VS Code extension POSTs the current code + language here so we
      // have context for /explain without needing to reach back to the editor.
      let body = '';
      req.on('data', (chunk) => (body += chunk));
      req.on('end', () => {
        try {
          const payload = JSON.parse(body || '{}');
          lastNudgeContext = {
            ...lastNudgeContext,
            code: payload.code,
            language: payload.language,
          };
          res.writeHead(200, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: true }));
        } catch (e) {
          res.writeHead(400, { 'Content-Type': 'application/json' });
          res.end(JSON.stringify({ ok: false, error: 'invalid json' }));
        }
      });
    } else if (req.method === 'GET' && req.url === '/health') {
      res.writeHead(200, { 'Content-Type': 'application/json' });
      res.end(JSON.stringify({ status: 'ok' }));
    } else {
      res.writeHead(404);
      res.end();
    }
  });

  server.listen(PORT, '127.0.0.1', () => {
    console.log(`Companion listening on http://127.0.0.1:${PORT}`);
  });
}

/**
 * Ask the backend for a deeper explanation, then relay it to the renderer.
 */
function requestExplanation() {
  if (!lastNudgeContext || !lastNudgeContext.code || !lastNudgeContext.question) {
    console.log('[explain] No nudge context available — showing fallback');
    if (mainWindow) {
      mainWindow.webContents.send('explanation', {
        explanation: 'Try tracing through your code step by step with a small example. Pay close attention to boundary conditions.'
      });
    }
    return;
  }

  const payload = JSON.stringify({
    code: lastNudgeContext.code,
    language: lastNudgeContext.language || 'unknown',
    question: lastNudgeContext.question,
    misconception_tag: lastNudgeContext.misconception_tag || '',
  });

  const url = new URL('/explain', BACKEND_URL);

  const req = http.request(
    url,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(payload),
      },
      timeout: 20000,
    },
    (res) => {
      let body = '';
      res.on('data', (chunk) => (body += chunk));
      res.on('end', () => {
        try {
          const result = JSON.parse(body);
          console.log('[explain] Got explanation from backend');
          if (mainWindow) {
            mainWindow.webContents.send('explanation', { explanation: result.explanation });
          }
        } catch (e) {
          console.log('[explain] Failed to parse response:', e.message);
          sendFallbackExplanation();
        }
      });
    }
  );

  req.on('timeout', () => {
    console.log('[explain] Backend timed out');
    req.destroy();
    sendFallbackExplanation();
  });

  req.on('error', (err) => {
    console.log('[explain] Backend error:', err.message);
    sendFallbackExplanation();
  });

  req.write(payload);
  req.end();
}

function sendFallbackExplanation() {
  const tag = lastNudgeContext && lastNudgeContext.misconception_tag;
  const fallbacks = {
    'off-by-one': 'Try walking through the loop with the smallest possible input. Count each iteration — does the last index actually exist?',
    'infinite-loop': 'Trace what changes on each pass. Is there a clear path that makes the condition false?',
    'missing-base-case': 'What happens when this function calls itself with the smallest input? Does it ever stop?',
    'missing-edge-case': 'Consider what happens when the input is empty, null, or has just one element.',
    'loose-equality': 'JavaScript\'s == can coerce types in surprising ways. Try checking typeof on both sides.',
  };
  const explanation = (tag && fallbacks[tag]) ||
    'Try tracing through your code step by step with a small example. Pay close attention to boundary conditions.';

  if (mainWindow) {
    mainWindow.webContents.send('explanation', { explanation });
  }
}

ipcMain.on('nudgeResponse', (_event, action) => {
  console.log('Student responded:', action);
  if (action === 'help') {
    // Switch to thinking state while we fetch the explanation
    if (mainWindow) {
      mainWindow.webContents.send('mood', { mood: 'thinking-explain' });
    }
    requestExplanation();
  }
  // 'dismiss' is handled client-side (hideNudge) — nothing else to do.
});

app.whenReady().then(() => {
  createWindow();
  startLocalServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

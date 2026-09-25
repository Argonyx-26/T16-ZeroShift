const { app, BrowserWindow, screen, ipcMain } = require('electron');
const path = require('path');
const http = require('http');

const PORT = 4123;
let mainWindow;

function createWindow() {
  const { width, height } = screen.getPrimaryDisplay().workAreaSize;

  mainWindow = new BrowserWindow({
    width: 320,
    height: 340,
    x: width - 340,   // bottom-right corner by default; draggable after that
    y: height - 360,
    transparent: true,
    frame: false,
    alwaysOnTop: true,
    skipTaskbar: true,   // don't clutter the taskbar/dock
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
          if (mainWindow) mainWindow.webContents.send(channel, payload);
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

ipcMain.on('nudgeResponse', (_event, action) => {
  console.log('Student responded:', action);
  // Extension point: POST this back to your backend so "help me understand" vs
  // "I've got it" actually persists to ide_sessions.companion_nudges_accepted.
});

app.whenReady().then(() => {
  createWindow();
  startLocalServer();
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

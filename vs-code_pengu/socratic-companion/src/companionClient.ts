import * as http from 'http';

const DESKTOP_APP_BASE = 'http://127.0.0.1:4123';
const REQUEST_TIMEOUT_MS = 1000;

export type Mood = 'idle' | 'thinking' | 'alert';

/**
 * Talks to the Electron desktop pet over localhost. Every call fails
 * silently (resolves rather than rejects) if the desktop app isn't
 * running — a missing mascot window should never interrupt coding.
 */
export class CompanionClient {
  async sendNudge(question: string, misconceptionTag: string): Promise<void> {
    await this.post('/nudge', { question, misconception_tag: misconceptionTag });
  }

  async setMood(mood: Mood): Promise<void> {
    await this.post('/mood', { mood });
  }

  /** Send current code context so the desktop app can request /explain. */
  async sendContext(code: string, language: string): Promise<void> {
    await this.post('/context', { code, language });
  }

  /** GET /health — used for the 20s heartbeat, not for gating nudges. */
  checkHealth(): Promise<boolean> {
    return new Promise((resolve) => {
      const req = http.request(
        `${DESKTOP_APP_BASE}/health`,
        { method: 'GET', timeout: REQUEST_TIMEOUT_MS },
        (res) => {
          res.resume();
          resolve(!!res.statusCode && res.statusCode < 400);
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.on('error', () => resolve(false));
      req.end();
    });
  }

  private post(path: string, body: unknown): Promise<void> {
    return new Promise((resolve) => {
      const payload = JSON.stringify(body);
      const req = http.request(
        `${DESKTOP_APP_BASE}${path}`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload)
          },
          timeout: REQUEST_TIMEOUT_MS
        },
        (res) => {
          res.resume();
          resolve();
        }
      );
      req.on('timeout', () => {
        req.destroy();
        resolve();
      });
      req.on('error', () => resolve());
      req.write(payload);
      req.end();
    });
  }
}

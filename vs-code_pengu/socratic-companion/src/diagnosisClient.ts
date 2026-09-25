import * as vscode from 'vscode';
import * as http from 'http';
import * as https from 'https';

export interface DiagnosisResult {
  trigger: boolean;
  question: string;
  misconception_tag: string;
}

interface FallbackPattern {
  tag: string;
  test: (code: string) => boolean;
  question: string;
}

/**
 * Generic starter patterns. Item #6 on the handoff doc: worth tuning these
 * to whatever buggy snippet the live demo actually uses, so it reliably
 * fires on cue. Order matters — first match wins.
 */
const FALLBACK_PATTERNS: FallbackPattern[] = [
  {
    tag: 'off-by-one',
    test: (code) => /<=\s*[\w.]+\.length\b/.test(code),
    question:
      "What happens on the very last iteration here — does the index ever go one past where you meant it to?"
  },
  {
    tag: 'infinite-loop',
    test: (code) => /while\s*\(\s*true\s*\)/.test(code) && !/\bbreak\b/.test(code),
    question: 'Where does this loop decide it\u2019s done?'
  },
  {
    tag: 'missing-base-case',
    test: (code) => {
      const fnMatch = code.match(/function\s+(\w+)\s*\(/);
      if (!fnMatch) {
        return false;
      }
      const name = fnMatch[1];
      const calls = code.match(new RegExp(`\\b${name}\\s*\\(`, 'g')) || [];
      const hasGuard = /if\s*\(/.test(code);
      return calls.length > 1 && !hasGuard;
    },
    question: 'This calls itself — what stops it from calling itself forever?'
  },
  {
    tag: 'missing-edge-case',
    test: (code) =>
      /function\s+\w+\s*\([^)]*\)\s*{[\s\S]*}/.test(code) &&
      !/(length\s*===?\s*0|\.length\s*<\s*1|is(Empty|Null)|=== *null|=== *undefined)/.test(code),
    question: 'What would this do if it were handed an empty input?'
  },
  {
    tag: 'loose-equality',
    test: (code) => /[^=!<>]==[^=]/.test(code),
    question: 'Is `==` doing what you expect here, or could a type mismatch slip through?'
  }
];

export class DiagnosisClient {
  private getConfig() {
    return vscode.workspace.getConfiguration('socraticCompanion');
  }

  private getBackendUrl(): string | undefined {
    const url = this.getConfig().get<string>('backendUrl', '');
    return url ? url : undefined;
  }

  private getAuthToken(): string | undefined {
    // TODO(auth teammate): swap for a token pulled from context.secrets
    // once the OAuth handshake lands, instead of this plain setting.
    const token = this.getConfig().get<string>('authToken', '');
    return token ? token : undefined;
  }

  async diagnose(code: string, language: string, diagnostics: string[] = [], timeoutMs = 15000): Promise<DiagnosisResult> {
    const backendUrl = this.getBackendUrl();
    if (backendUrl) {
      try {
        return await this.callBackend(backendUrl, code, language, diagnostics, timeoutMs);
      } catch {
        // Fall through to the local fallback on any failure/timeout — this
        // is what keeps demos reliable without a network connection.
      }
    }
    return this.localFallback(code);
  }

  private callBackend(
    backendUrl: string,
    code: string,
    language: string,
    diagnostics: string[],
    timeoutMs: number
  ): Promise<DiagnosisResult> {
    return new Promise((resolve, reject) => {
      let url: URL;
      try {
        url = new URL('/diagnose', backendUrl);
      } catch (e) {
        reject(e);
        return;
      }

      const payload = JSON.stringify({ code, language, diagnostics });
      const lib = url.protocol === 'https:' ? https : http;
      const token = this.getAuthToken();

      const req = lib.request(
        url,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Content-Length': Buffer.byteLength(payload),
            ...(token ? { Authorization: `Bearer ${token}` } : {})
          },
          timeout: timeoutMs
        },
        (res) => {
          let body = '';
          res.on('data', (chunk) => (body += chunk));
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                const parsed = JSON.parse(body);
                if (
                  typeof parsed.trigger === 'boolean' &&
                  typeof parsed.question === 'string' &&
                  typeof parsed.misconception_tag === 'string'
                ) {
                  resolve(parsed as DiagnosisResult);
                  return;
                }
                reject(new Error('Malformed /diagnose response shape'));
              } catch (e) {
                reject(e);
              }
            } else {
              reject(new Error(`/diagnose returned status ${res.statusCode}`));
            }
          });
        }
      );

      req.on('timeout', () => req.destroy(new Error('diagnose request timed out')));
      req.on('error', reject);
      req.write(payload);
      req.end();
    });
  }

  private localFallback(code: string): DiagnosisResult {
    for (const pattern of FALLBACK_PATTERNS) {
      if (pattern.test(code)) {
        return { trigger: true, question: pattern.question, misconception_tag: pattern.tag };
      }
    }
    return { trigger: false, question: '', misconception_tag: '' };
  }
}

import * as vscode from 'vscode';

export interface ChunkAnalysis {
  /** True when this pass detected the end of a "meaningful chunk" of code
   *  (as opposed to mid-thought/partial edits). */
  meaningfulChunkCompleted: boolean;
  /** Current diagnostics (errors/warnings) count for the document. */
  diagnosticsCount: number;
}

/**
 * Detects whether an edit just completed a meaningful chunk of code:
 *  - brace-based languages: `{`/`}` balance flips from unbalanced -> balanced
 *  - Python: a `def` block's indentation closes
 *
 * Keeps small pieces of state between calls so it can detect *transitions*
 * rather than just current state. One instance per open document is fine;
 * this extension uses a single instance and only calls analyze() for the
 * active editor's document, which is close enough for a study-companion
 * heuristic (not a full parser).
 */
export class CodeAnalyzer {
  private wasBalanced = true;
  private wasInsidePythonDefBody = false;

  analyze(document: vscode.TextDocument): ChunkAnalysis {
    const diagnosticsCount = vscode.languages.getDiagnostics(document.uri).length;
    const text = document.getText();

    const meaningfulChunkCompleted =
      document.languageId === 'python'
        ? this.detectPythonDefClose(text)
        : this.detectBraceBalanceFlip(text);

    return { meaningfulChunkCompleted, diagnosticsCount };
  }

  private detectBraceBalanceFlip(text: string): boolean {
    const isBalanced = this.computeBraceBalance(text) === 0;
    const flipped = !this.wasBalanced && isBalanced;
    this.wasBalanced = isBalanced;
    return flipped;
  }

  /** Rough `{`/`}` balance that ignores braces inside strings/comments. */
  private computeBraceBalance(text: string): number {
    let balance = 0;
    let inString: '"' | "'" | '`' | null = null;
    let inLineComment = false;
    let inBlockComment = false;

    for (let i = 0; i < text.length; i++) {
      const ch = text[i];
      const next = text[i + 1];

      if (inLineComment) {
        if (ch === '\n') {
          inLineComment = false;
        }
        continue;
      }
      if (inBlockComment) {
        if (ch === '*' && next === '/') {
          inBlockComment = false;
          i++;
        }
        continue;
      }
      if (inString) {
        if (ch === '\\') {
          i++;
          continue;
        }
        if (ch === inString) {
          inString = null;
        }
        continue;
      }

      if (ch === '"' || ch === "'" || ch === '`') {
        inString = ch;
        continue;
      }
      if (ch === '/' && next === '/') {
        inLineComment = true;
        continue;
      }
      if (ch === '/' && next === '*') {
        inBlockComment = true;
        continue;
      }

      if (ch === '{') {
        balance++;
      } else if (ch === '}') {
        balance--;
      }
    }
    return balance;
  }

  /**
   * Detects a `def` block closing: walks the whole document, tracking
   * whether the last non-blank line sits inside the most recent def's
   * body (deeper indent). When that flips true -> false between calls,
   * a def block just closed.
   */
  private detectPythonDefClose(text: string): boolean {
    const isInsideDefBody = this.computeInsidePythonDefBody(text);
    const justClosed = this.wasInsidePythonDefBody && !isInsideDefBody;
    this.wasInsidePythonDefBody = isInsideDefBody;
    return justClosed;
  }

  private computeInsidePythonDefBody(text: string): boolean {
    const lines = text.split('\n');
    let defIndent: number | null = null;
    let inBody = false;

    for (const raw of lines) {
      if (raw.trim() === '') {
        continue;
      }
      const indent = raw.length - raw.trimStart().length;
      const trimmed = raw.trim();

      if (trimmed.startsWith('def ')) {
        defIndent = indent;
        inBody = false;
        continue;
      }
      if (defIndent === null) {
        continue;
      }
      if (indent > defIndent) {
        inBody = true;
      } else {
        // A line at or above the def's own indent means that block is over.
        defIndent = null;
        inBody = false;
      }
    }
    return inBody;
  }
}

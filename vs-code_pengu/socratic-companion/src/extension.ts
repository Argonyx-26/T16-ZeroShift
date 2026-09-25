import * as vscode from 'vscode';
import { SessionTracker } from './sessionTracker';
import { CodeAnalyzer, ChunkAnalysis } from './codeAnalyzer';
import { DiagnosisClient } from './diagnosisClient';
import { CompanionClient } from './companionClient';

export function activate(context: vscode.ExtensionContext): void {
  const output = vscode.window.createOutputChannel('Socratic Companion');
  const analyzer = new CodeAnalyzer();
  const diagnosisClient = new DiagnosisClient();
  const companionClient = new CompanionClient();

  const failedTestThreshold = vscode.workspace
    .getConfiguration('socraticCompanion')
    .get<number>('failedTestThreshold', 2);

  const tracker = new SessionTracker(
    // Fires 5s after typing pauses. This IS the "decided interval" the
    // current document gets posted to the backend on -- unconditionally.
    () => {
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        void reviewDocument(editor.document, 'debounce');
      }
    },
    // 20s liveness ping. Only confirms the desktop app is reachable --
    // does not post code and does not gate anything.
    () => {
      void companionClient.checkHealth().then((alive) => {
        output.appendLine(
          `[heartbeat] desktop companion ${alive ? 'reachable' : 'not reachable'} on 127.0.0.1:4123`
        );
      });
    },
    failedTestThreshold
  );

  /**
   * Sends the current document to the backend for review. Runs on every
   * 5s debounce settle AND immediately on a failed test run -- with no
   * local heuristic deciding whether to ASK the backend. `meaningfulChunk
   * Completed` / `isSessionGood` are still computed and logged for
   * visibility, but they no longer block the call. That's what previously
   * let a real bug sit in the editor and never get reviewed: the heuristic
   * guessed "nothing to see here" before the backend ever got a chance to
   * look. The backend (and its dedup-by-hash cache) is now responsible for
   * deciding whether there's anything worth reacting to.
   */
  async function reviewDocument(
    document: vscode.TextDocument,
    reason: 'debounce' | 'failed-test'
  ): Promise<void> {
    const analysis: ChunkAnalysis = analyzer.analyze(document);
    tracker.recordDiagnosticsCount(analysis.diagnosticsCount);
    output.appendLine(
      `[review:${reason}] chunkCompleted=${analysis.meaningfulChunkCompleted} ` +
        `diagnostics=${analysis.diagnosticsCount} sessionGood=${tracker.isSessionGood()}`
    );

    const startTime = Date.now();
    const MIN_HOLD_MS = 5000;

    // Collect VS Code diagnostics (compiler errors, warnings) so the backend
    // and LLM know what the student is actually struggling with.
    const rawDiagnostics = vscode.languages.getDiagnostics(document.uri);
    const diagnosticMessages = rawDiagnostics
      .filter((d) => d.severity === vscode.DiagnosticSeverity.Error || d.severity === vscode.DiagnosticSeverity.Warning)
      .map((d) => `Line ${d.range.start.line + 1}: [${d.severity === vscode.DiagnosticSeverity.Error ? 'ERROR' : 'WARN'}] ${d.message}`);

    await companionClient.setMood('thinking');
    try {
      const result = await diagnosisClient.diagnose(document.getText(), document.languageId, diagnosticMessages);

      // Ensure thinking state is held for at least MIN_HOLD_MS (5 seconds)
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_HOLD_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_HOLD_MS - elapsed));
      }

      if (result.trigger) {
        output.appendLine(`[nudge] ${result.misconception_tag}: ${result.question}`);
        // Send code context first so the desktop app can request /explain
        // if the student clicks "Help me understand".
        await companionClient.sendContext(document.getText(), document.languageId);
        await companionClient.setMood('alert');
        await companionClient.sendNudge(result.question, result.misconception_tag);
        tracker.resetFailedTests();
      } else {
        output.appendLine('[review] no trigger -- back to idle');
        await companionClient.setMood('idle');
      }
    } catch (err) {
      const errorMsg = String(err);
      output.appendLine(`[error] diagnosis failed: ${errorMsg}`);

      // Surface the error to the student via a nudge instead of silently
      // resetting to idle — this was the main reason the mascot appeared to
      // "do nothing" when the backend or Ollama was down/slow.
      const elapsed = Date.now() - startTime;
      if (elapsed < MIN_HOLD_MS) {
        await new Promise((resolve) => setTimeout(resolve, MIN_HOLD_MS - elapsed));
      }

      let userMessage = 'I had trouble analyzing your code — ';
      if (errorMsg.includes('timed out')) {
        userMessage += 'the analysis server took too long to respond. Is Ollama running?';
      } else if (errorMsg.includes('ECONNREFUSED')) {
        userMessage += 'the backend server appears to be offline.';
      } else {
        userMessage += 'an unexpected error occurred. Check the Output panel for details.';
      }

      await companionClient.setMood('alert');
      await companionClient.sendNudge(userMessage, 'analysis-error');
    }
  }

  void companionClient.setMood('idle');
  output.appendLine('Socratic Companion activated.');
  output.appendLine(
    `Posting to backend every 5s of inactivity (${vscode.workspace
      .getConfiguration('socraticCompanion')
      .get<string>('backendUrl', '')} or local fallback if unset/unreachable).`
  );

  const changeSub = vscode.workspace.onDidChangeTextDocument((e) => {
    if (e.document !== vscode.window.activeTextEditor?.document) {
      return;
    }
    tracker.recordActivity();
  });

  // Counts failed test runs from any task (npm test, pytest, etc.) that
  // exits non-zero, and reviews immediately rather than waiting out the
  // next 5s debounce window.
  const taskSub = vscode.tasks.onDidEndTaskProcess((e) => {
    if (e.exitCode === undefined) {
      return;
    }
    if (e.exitCode !== 0) {
      tracker.recordFailedTest();
      output.appendLine(`[test] failed run recorded (count=${tracker.getFailedTestCount()})`);
      const editor = vscode.window.activeTextEditor;
      if (editor) {
        void reviewDocument(editor.document, 'failed-test');
      }
    } else {
      tracker.resetFailedTests();
    }
  });

  // Lets you confirm the extension <-> desktop app wiring is alive without
  // needing to type a bug-triggering snippet first.
  const testNudgeCmd = vscode.commands.registerCommand('socraticCompanion.sendTestNudge', async () => {
    await companionClient.setMood('alert');
    await companionClient.sendNudge(
      'Are you sure this handles an empty array?',
      'edge-case-missed'
    );
    output.appendLine('[test] sent canned test nudge to desktop companion');
  });

  context.subscriptions.push(changeSub, taskSub, testNudgeCmd, output, {
    dispose: () => tracker.dispose()
  });
}

export function deactivate(): void {
  // No-op: everything is cleaned up via context.subscriptions.
}

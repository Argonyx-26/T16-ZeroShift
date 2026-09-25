/**
 * Tracks the timing/state side of a coding session:
 *  - debounces edits so analysis only runs 5s after typing pauses
 *  - pings a heartbeat every 20s while the session is active
 *  - counts consecutive failed test runs
 *  - decides whether the session currently looks "good enough" that we
 *    should suppress nudging (isSessionGood)
 *
 * This class holds no VS Code API references so it's trivial to unit test.
 */
export class SessionTracker {
  private debounceTimer: ReturnType<typeof setTimeout> | undefined;
  private heartbeatTimer: ReturnType<typeof setInterval> | undefined;

  private failedTestCount = 0;
  private diagnosticsHistory: number[] = [];

  private readonly HISTORY_SIZE = 5;
  /** Average diagnostics count at/under which we consider things "quiet". */
  private readonly ERROR_THRESHOLD = 1;
  private readonly DEBOUNCE_MS = 5000;
  private readonly HEARTBEAT_MS = 20000;

  constructor(
    /** Fired 5s after the last recorded activity (i.e. once typing has paused). */
    private readonly onDebouncedActivity: () => void,
    /** Fired every 20s while the session has seen at least one activity. */
    private readonly onHeartbeat: () => void,
    private readonly failedTestThreshold: number = 2
  ) {}

  /** Call on every text-document change. */
  recordActivity(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    this.debounceTimer = setTimeout(() => this.onDebouncedActivity(), this.DEBOUNCE_MS);
    this.ensureHeartbeat();
  }

  private ensureHeartbeat(): void {
    if (this.heartbeatTimer) {
      return;
    }
    this.heartbeatTimer = setInterval(() => this.onHeartbeat(), this.HEARTBEAT_MS);
  }

  /** Feed in the diagnostics count observed after each analysis pass. */
  recordDiagnosticsCount(count: number): void {
    this.diagnosticsHistory.push(count);
    if (this.diagnosticsHistory.length > this.HISTORY_SIZE) {
      this.diagnosticsHistory.shift();
    }
  }

  recordFailedTest(): void {
    this.failedTestCount++;
  }

  resetFailedTests(): void {
    this.failedTestCount = 0;
  }

  getFailedTestCount(): number {
    return this.failedTestCount;
  }

  hasEnoughFailedTests(): boolean {
    return this.failedTestCount >= this.failedTestThreshold;
  }

  /**
   * True when the session looks healthy: no failed tests, and the recent
   * diagnostics count is low/empty. This is informational only now (logged
   * alongside every review) -- it no longer gates whether the current
   * document gets posted to the backend. Gating on this previously meant a
   * real bug could sit in the code without ever being sent for review, just
   * because this heuristic guessed the session looked "fine".
   */
  isSessionGood(): boolean {
    if (this.failedTestCount > 0) {
      return false;
    }
    if (this.diagnosticsHistory.length === 0) {
      return true;
    }
    const avg =
      this.diagnosticsHistory.reduce((sum, n) => sum + n, 0) / this.diagnosticsHistory.length;
    return avg <= this.ERROR_THRESHOLD;
  }

  dispose(): void {
    if (this.debounceTimer) {
      clearTimeout(this.debounceTimer);
    }
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
  }
}

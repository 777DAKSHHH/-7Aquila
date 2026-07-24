/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * TIMER SERVICE
 *
 * Single source of truth for CBT timers across modules.
 * - Timestamp-based accuracy to prevent background tab drift.
 * - Periodic database synchronization callbacks.
 * - Warning threshold states (Normal, Warning, Critical, Expired).
 * ==========================================================
 */

export class TimerService {
  constructor({
    duration = 1200,
    remainingSeconds = null,
    syncIntervalSeconds = 15,
    onTick,
    onSync,
    onComplete,
  }) {
    this.duration = duration;
    // Initial remaining time: use remainingSeconds if provided, else full duration
    this.remaining =
      typeof remainingSeconds === "number" && remainingSeconds >= 0
        ? Math.min(remainingSeconds, duration)
        : duration;

    this.syncIntervalSeconds = syncIntervalSeconds;
    this.onTick = onTick;
    this.onSync = onSync;
    this.onComplete = onComplete;

    this.interval = null;
    this.running = false;
    this.targetEndTime = null;
    this.lastSyncedSeconds = this.remaining;
  }

  start() {
    if (this.running || this.remaining <= 0) return;

    this.running = true;
    // Set absolute target end timestamp based on remaining seconds
    this.targetEndTime = Date.now() + this.remaining * 1000;

    this.interval = setInterval(() => {
      // Calculate exact remaining time using current timestamp to eliminate drift
      const now = Date.now();
      const diffSeconds = Math.max(
        0,
        Math.round((this.targetEndTime - now) / 1000)
      );

      this.remaining = diffSeconds;
      this.onTick?.(this.remaining, this.getRemainingTime());

      // Check periodic database sync threshold
      if (
        this.onSync &&
        Math.abs(this.lastSyncedSeconds - this.remaining) >=
          this.syncIntervalSeconds
      ) {
        this.lastSyncedSeconds = this.remaining;
        this.onSync(this.remaining);
      }

      // Check completion
      if (this.remaining <= 0) {
        this.stop();
        if (this.onSync) {
          this.onSync(0);
        }
        this.onComplete?.();
      }
    }, 1000);
  }

  pause() {
    if (!this.running) return;

    clearInterval(this.interval);
    this.interval = null;
    this.running = false;
  }

  resume() {
    if (this.running || this.remaining <= 0) return;
    this.start();
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval);
      this.interval = null;
    }
    this.running = false;
  }

  reset(seconds = this.duration) {
    this.stop();
    this.remaining = seconds;
    this.lastSyncedSeconds = seconds;
  }

  getRemainingSeconds() {
    return this.remaining;
  }

  getRemainingTime() {
    const hrs = Math.floor(this.remaining / 3600);
    const mins = Math.floor((this.remaining % 3600) / 60);
    const secs = this.remaining % 60;

    const formattedMins = String(mins).padStart(2, "0");
    const formattedSecs = String(secs).padStart(2, "0");

    const formatted =
      hrs > 0
        ? `${String(hrs).padStart(2, "0")}:${formattedMins}:${formattedSecs}`
        : `${formattedMins}:${formattedSecs}`;

    return {
      hrs,
      mins,
      secs,
      formatted,
    };
  }

  /**
   * Warning Thresholds:
   * - 'normal': > 5 min (300s)
   * - 'warning': <= 5 min (300s) & > 1 min (60s)
   * - 'critical': <= 1 min (60s) & > 0s
   * - 'expired': 0s
   */
  getWarningState() {
    if (this.remaining <= 0) return "expired";
    if (this.remaining <= 60) return "critical";
    if (this.remaining <= 300) return "warning";
    return "normal";
  }

  isRunning() {
    return this.running;
  }
}
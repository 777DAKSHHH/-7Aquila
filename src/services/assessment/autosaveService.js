/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * AutoSave Service
 *
 * Production-Grade Autosave Engine:
 * - Debounced saving
 * - Rich observable save state machine ('idle' | 'typing' | 'saving' | 'saved' | 'retrying' | 'failed')
 * - Exponential backoff retry strategy for network resilience
 * - Visibility change & BeforeUnload handlers
 * - Concurrency control & deduplication
 * ==========================================================
 */

export class AutoSaveService {
  constructor({
    saveFunction,
    delay = 2500, // 2.5s debounce default for essay typing
    maxRetries = 3,
    onStatusChange,
  }) {
    this.saveFunction = saveFunction;
    this.delay = delay;
    this.maxRetries = maxRetries;
    this.onStatusChange = onStatusChange;

    this.timer = null;
    this.retryTimer = null;
    this.isSaving = false;
    this.hasChanges = false;
    this.hasPendingQueue = false;
    this.pendingData = null;

    this.lastSavedData = null;
    this.retryCount = 0;
    this.lastSavedAt = null;

    this.state = {
      status: "idle", // 'idle' | 'typing' | 'saving' | 'saved' | 'retrying' | 'failed'
      lastSavedAt: null,
      pendingChanges: false,
      retryCount: 0,
      isDirty: false,
      hasUnsavedChanges: false,
      error: null,
    };
  }

  updateState(updates) {
    this.state = {
      ...this.state,
      ...updates,
    };
    this.onStatusChange?.(this.state);
  }

  /**
   * Mark content as changed by student typing.
   */
  markAsChanged(currentData) {
    const serialized = JSON.stringify(currentData);

    if (serialized === this.lastSavedData) {
      return;
    }

    this.hasChanges = true;
    this.pendingData = currentData;

    this.updateState({
      status: "typing",
      isDirty: true,
      hasUnsavedChanges: true,
      pendingChanges: true,
    });

    this.resetTimer(currentData);
  }

  /**
   * Reset debounce timer.
   */
  resetTimer(data) {
    clearTimeout(this.timer);

    this.timer = setTimeout(() => {
      this.save(data);
    }, this.delay);
  }

  /**
   * Perform autosave request with retry strategy.
   */
  async save(data = this.pendingData, isRetryAttempt = false) {
    if (!data) return;

    const serialized = JSON.stringify(data);

    if (!isRetryAttempt && serialized === this.lastSavedData && !this.hasChanges) {
      return;
    }

    if (this.isSaving) {
      this.hasPendingQueue = true;
      this.pendingData = data;
      return;
    }

    this.isSaving = true;

    if (!isRetryAttempt) {
      this.updateState({
        status: "saving",
        error: null,
      });
    }

    try {
      const res = await this.saveFunction(data);

      if (res && res.success === false) {
        throw new Error(res.error || "Autosave request returned failure.");
      }

      this.lastSavedData = serialized;
      this.hasChanges = false;
      this.retryCount = 0;
      this.lastSavedAt = new Date();

      this.updateState({
        status: "saved",
        lastSavedAt: this.lastSavedAt,
        hasUnsavedChanges: false,
        isDirty: false,
        pendingChanges: false,
        retryCount: 0,
        error: null,
      });

      // Process queued data if user typed while save was in progress
      if (this.hasPendingQueue) {
        this.hasPendingQueue = false;
        const latestData = this.pendingData;
        this.isSaving = false;
        this.save(latestData);
        return;
      }
    } catch (error) {
      console.error("[Rocket AutoSave Engine]", error);

      if (this.retryCount < this.maxRetries) {
        this.retryCount += 1;
        const backoffDelay = Math.pow(2, this.retryCount - 1) * 1000; // 1s, 2s, 4s

        this.updateState({
          status: "retrying",
          retryCount: this.retryCount,
          error: error.message || "Transient save failure.",
        });

        clearTimeout(this.retryTimer);
        this.retryTimer = setTimeout(() => {
          this.isSaving = false;
          this.save(data, true);
        }, backoffDelay);

        return;
      } else {
        this.updateState({
          status: "failed",
          retryCount: this.retryCount,
          error: error.message || "Failed to autosave after multiple attempts.",
        });
      }
    } finally {
      if (!this.hasPendingQueue && this.state.status !== "retrying") {
        this.isSaving = false;
      }
    }
  }

  /**
   * Manual / Immediate save action.
   */
  async forceSave(data = this.pendingData) {
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
    this.retryCount = 0;
    await this.save(data);
  }

  /**
   * Clean up timers on unmount.
   */
  destroy() {
    clearTimeout(this.timer);
    clearTimeout(this.retryTimer);
    this.timer = null;
    this.retryTimer = null;
  }
}

/**
 * ==========================================================
 * SAVE WHEN USER SWITCHES / LEAVES TAB
 * ==========================================================
 */
export const registerVisibilitySave = (autosave, getCurrentData) => {
  const handler = async () => {
    if (document.visibilityState === "hidden") {
      const data = getCurrentData();
      if (data) {
        await autosave.forceSave(data);
      }
    }
  };

  document.addEventListener("visibilitychange", handler);

  return () => {
    document.removeEventListener("visibilitychange", handler);
  };
};

/**
 * ==========================================================
 * SAVE BEFORE PAGE CLOSE / REFRESH
 * ==========================================================
 */
export const registerBeforeUnload = (autosave, getCurrentData) => {
  const handler = (event) => {
    const data = getCurrentData();
    if (data && autosave.state.hasUnsavedChanges) {
      autosave.forceSave(data);
      event.preventDefault();
      event.returnValue = "";
    }
  };

  window.addEventListener("beforeunload", handler);

  return () => {
    window.removeEventListener("beforeunload", handler);
  };
};

/**
 * ==========================================================
 * MANUAL SAVE WRAPPER
 * ==========================================================
 */
export const manualSave = async (autosave, getCurrentData) => {
  const data = getCurrentData();
  if (data) {
    await autosave.forceSave(data);
  }
};

/**
 * ==========================================================
 * AUTOSAVE MANAGER EXPORT
 * ==========================================================
 */
export const AutoSaveManager = {
  AutoSaveService,
  registerVisibilitySave,
  registerBeforeUnload,
  manualSave,
};

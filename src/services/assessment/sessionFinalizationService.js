import { SessionService, SESSION_STATUS } from "./sessionService";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * SESSION FINALIZATION ENGINE SERVICE
 *
 * Officially closes CBT writing sessions after submission.
 * Calculates final completion metadata, locks session lifecycle,
 * and prevents double finalization (Idempotent).
 * ==========================================================
 */

/**
 * Finalization Engine Statuses
 */
export const FINALIZATION_STATES = {
  IDLE: "idle",
  FINALIZING: "finalizing",
  COMPLETED: "completed",
  ALREADY_FINALIZED: "already_finalized",
  FAILED: "failed",
};

/**
 * Finalize writing session after submission pipeline completes.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Target writing session UUID
 * @param {number} params.wordCount - Final essay word count from WritingAnalysisService
 * @param {number} params.remainingSeconds - Final remaining countdown seconds from TimerService
 * @param {number} params.durationSeconds - Total examination time limit in seconds (1200s default)
 * @returns {Promise<Object>} Finalization result
 */
export const finalizeWritingSession = async ({
  sessionId,
  wordCount = 0,
  remainingSeconds = 0,
  durationSeconds = 1200,
}) => {
  if (!sessionId) {
    return {
      success: false,
      error: "Missing session ID for finalization.",
      errorCode: "MISSING_SESSION_ID",
    };
  }

  try {
    // 1. Check existing session status (Idempotency Guard)
    const sessionRes = await SessionService.getWritingSession(sessionId);

    if (!sessionRes || !sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes?.error || "Writing session not found.",
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    const currentSession = sessionRes.data;

    // Idempotency: If session is already completed, return existing finalized data
    if (
      currentSession.status === SESSION_STATUS.COMPLETED ||
      (currentSession.is_draft === false && currentSession.completed_at)
    ) {
      return {
        success: true,
        data: currentSession,
        alreadyFinalized: true,
        status: FINALIZATION_STATES.ALREADY_FINALIZED,
      };
    }

    // 2. Calculate Final Statistics
    const timeTakenSeconds = Math.max(0, durationSeconds - remainingSeconds);
    const completionTimestamp = new Date().toISOString();

    const finalPayload = {
      status: SESSION_STATUS.COMPLETED,
      is_draft: false,
      task1_word_count: Number(wordCount) || 0,
      task1_time_seconds: timeTakenSeconds,
      total_time_seconds: timeTakenSeconds,
      completed_at: completionTimestamp,
      submitted_at: currentSession.submitted_at || completionTimestamp,
      last_saved_at: completionTimestamp,
    };

    // 3. Persist Finalization to Database via SessionService
    const updateRes = await SessionService.updateWritingSession(
      sessionId,
      finalPayload
    );

    if (!updateRes || !updateRes.success || !updateRes.data) {
      throw new Error(
        updateRes?.error || "Failed to update database during session finalization."
      );
    }

    return {
      success: true,
      data: updateRes.data,
      alreadyFinalized: false,
      status: FINALIZATION_STATES.COMPLETED,
      finalizedAt: completionTimestamp,
    };
  } catch (err) {
    console.error("[Rocket Session Finalization Engine Error]", err);
    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred while finalizing the writing session.",
      errorCode: "FINALIZATION_FAILED",
    };
  }
};

/**
 * Exported Session Finalization Engine Gateway
 */
export const SessionFinalizationService = {
  FINALIZATION_STATES,
  finalizeWritingSession,
};

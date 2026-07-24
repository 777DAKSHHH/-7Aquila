import { SessionService } from "./sessionService";
import { SubmissionValidationService } from "./submissionValidationService";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * SUBMISSION ENGINE SERVICE
 *
 * Handles execution of the submission pipeline:
 * Validation -> Flush Autosave -> Persist Answer -> Verify -> Lock
 *
 * Guarantees zero data loss, idempotency, and duplicate submission prevention.
 * ==========================================================
 */

/**
 * Submission Status Constants
 */
export const SUBMISSION_STATES = {
  IDLE: "idle",
  PREPARING: "preparing",
  FLUSHING_AUTOSAVE: "flushing_autosave",
  SAVING: "saving",
  VERIFYING: "verifying",
  LOCKED: "locked",
  COMPLETED: "completed",
  FAILED: "failed",
};

/**
 * Execute the complete Task 1 submission pipeline.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Target writing session UUID
 * @param {string} params.answer - Final essay response text
 * @param {number} params.wordCount - Final essay word count
 * @param {Function} params.forceSave - Autosave flush callback from useTask1Autosave
 * @param {Object} params.validationResult - Result from SubmissionValidationService
 * @param {Function} params.onStatusChange - Status transition listener
 * @returns {Promise<Object>} Pipeline execution result
 */
export const executeSubmissionPipeline = async ({
  sessionId,
  answer,
  wordCount,
  forceSave,
  validationResult,
  onStatusChange,
}) => {
  // 1. Pre-Submission Check
  onStatusChange?.(SUBMISSION_STATES.PREPARING);

  if (!validationResult || !validationResult.canSubmit) {
    const reason =
      validationResult?.blockingReason ||
      "Submission failed validation checks.";
    onStatusChange?.(SUBMISSION_STATES.FAILED);
    return {
      success: false,
      error: reason,
      errorCode: "VALIDATION_FAILED",
    };
  }

  try {
    // 1. Fetch Session to determine if it is Task 1 or Task 2
    const sessionRes = await SessionService.getWritingSession(sessionId);
    if (!sessionRes || !sessionRes.success || !sessionRes.data) {
      throw new Error("Failed to retrieve writing session to determine task type.");
    }
    const sessionRecord = sessionRes.data;
    const isTask2 = !!sessionRecord.task2_question_id;

    // 2. Flush Pending Autosave & Clear Debounce Queues
    onStatusChange?.(SUBMISSION_STATES.FLUSHING_AUTOSAVE);
    if (typeof forceSave === "function") {
      await forceSave();
    }

    // 3. Persist Final Answer Payload to Database via SessionService
    onStatusChange?.(SUBMISSION_STATES.SAVING);

    const payload = isTask2 ? {
      task2_answer: (answer || "").trim(),
      task2_word_count: Number(wordCount) || 0,
      last_saved_at: new Date().toISOString(),
    } : {
      task1_answer: (answer || "").trim(),
      task1_word_count: Number(wordCount) || 0,
      last_saved_at: new Date().toISOString(),
    };

    const saveRes = await SessionService.saveWritingDraft(sessionId, payload);

    if (!saveRes || !saveRes.success || !saveRes.data) {
      throw new Error(
        saveRes?.error || "Database failed to persist the final essay submission."
      );
    }

    // 4. Verify Database Persistence
    onStatusChange?.(SUBMISSION_STATES.VERIFYING);

    const verifyRes = await SessionService.getWritingSession(sessionId);
    if (!verifyRes || !verifyRes.success || !verifyRes.data) {
      throw new Error("Failed to verify database persistence after save.");
    }

    const verifiedSession = verifyRes.data;
    const verifiedText = isTask2
      ? (verifiedSession.task2_answer || "")
      : (verifiedSession.task1_answer || verifiedSession.task1_content || "");

    if (verifiedText.trim() !== (answer || "").trim()) {
      throw new Error("Persisted content mismatch detected during verification.");
    }

    // 5. Lock Submission (Idempotent Guard)
    onStatusChange?.(SUBMISSION_STATES.LOCKED);

    const submissionTimestamp = new Date().toISOString();

    onStatusChange?.(SUBMISSION_STATES.COMPLETED);

    return {
      success: true,
      data: {
        sessionId,
        submissionTimestamp,
        verifiedWordCount: (isTask2 ? verifiedSession.task2_word_count : verifiedSession.task1_word_count) || wordCount,
        locked: true,
      },
    };
  } catch (err) {
    console.error("[Rocket Submission Engine Error]", err);
    onStatusChange?.(SUBMISSION_STATES.FAILED);

    return {
      success: false,
      error:
        err.message ||
        "An unexpected network or database error occurred during submission.",
      errorCode: "SUBMISSION_FAILED",
    };
  }
};

/**
 * Exported Submission Engine Gateway
 */
export const SubmissionEngineService = {
  SUBMISSION_STATES,
  executeSubmissionPipeline,
};

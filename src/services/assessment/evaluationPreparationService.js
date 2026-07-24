import { SessionService, SESSION_STATUS } from "./sessionService";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * EVALUATION PREPARATION SERVICE
 *
 * Handoff engine between Examination Runtime & Evaluation Architecture.
 * Validates complete examination data and updates session status to 'evaluating'.
 * DOES NOT call any AI models, prompts, or scoring algorithms.
 * ==========================================================
 */

/**
 * Evaluation Preparation States
 */
export const PREP_STATES = {
  IDLE: "idle",
  VALIDATING: "validating",
  PREPARING: "preparing",
  READY: "ready",
  ALREADY_PREPARED: "already_prepared",
  FAILED: "failed",
};

/**
 * Prepare a finalized session for future AI evaluation.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Target writing session UUID
 * @returns {Promise<Object>} Preparation result
 */
export const prepareSessionForEvaluation = async (sessionId) => {
  if (!sessionId) {
    return {
      success: false,
      error: "Missing session ID for evaluation preparation.",
      errorCode: "MISSING_SESSION_ID",
    };
  }

  try {
    // 1. Fetch & Verify Session Record
    const sessionRes = await SessionService.getWritingSession(sessionId);

    if (!sessionRes || !sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes?.error || "Writing session not found.",
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    const session = sessionRes.data;

    // 2. Idempotency Check
    if (session.status === SESSION_STATUS.EVALUATING) {
      return {
        success: true,
        data: session,
        alreadyPrepared: true,
        status: PREP_STATES.ALREADY_PREPARED,
      };
    }

    // 3. Validate Required Evaluation Inputs
    const errors = [];

    if (!session.student_id) {
      errors.push("Missing student ID.");
    }
    if (!session.task1_question_id) {
      errors.push("Missing Task 1 question ID.");
    }
    const answer = (session.task1_answer || session.task1_content || "").trim();
    if (!answer) {
      errors.push("Missing or empty essay response text.");
    }
    if (session.is_draft) {
      errors.push("Session is still marked as draft.");
    }

    if (errors.length > 0) {
      return {
        success: false,
        error: `Evaluation preparation failed validation: ${errors.join(" ")}`,
        errorCode: "VALIDATION_FAILED",
        validationErrors: errors,
      };
    }

    // 4. Update Session Status to 'evaluating' (Ready for Sprint 4 AI Evaluation)
    const updateRes = await SessionService.updateWritingSession(sessionId, {
      status: SESSION_STATUS.EVALUATING,
      updated_at: new Date().toISOString(),
    });

    if (!updateRes || !updateRes.success || !updateRes.data) {
      throw new Error(
        updateRes?.error || "Failed to update session status to evaluating."
      );
    }

    return {
      success: true,
      data: updateRes.data,
      alreadyPrepared: false,
      status: PREP_STATES.READY,
      preparedAt: new Date().toISOString(),
    };
  } catch (err) {
    console.error("[Rocket Evaluation Preparation Engine Error]", err);
    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred while preparing session for evaluation.",
      errorCode: "PREPARATION_FAILED",
    };
  }
};

/**
 * Exported Evaluation Preparation Engine Gateway
 */
export const EvaluationPreparationService = {
  PREP_STATES,
  prepareSessionForEvaluation,
};

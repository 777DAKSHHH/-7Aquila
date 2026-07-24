import { SessionService, SESSION_STATUS } from "./sessionService";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * EVALUATION PERSISTENCE ENGINE SERVICE (Sprint 4 - Phase 7)
 *
 * Single authority responsible for storing official evaluation records.
 * Atomic, idempotent persistence of overall score, criteria breakdown, detailed feedback,
 * AI provider metadata, and evaluation engine versions.
 *
 * DOES NOT call AI APIs, score bands, or generate feedback.
 * ==========================================================
 */

export const PERSISTENCE_VERSION = "v1.0.0";

/**
 * Persist evaluation results atomically to writing session store.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Target writing session UUID
 * @param {Object} params.evaluationContext - Context payload from Phase 1
 * @param {Object} params.evaluationPackage - Versioned package from Phase 2
 * @param {Object} params.rawProviderResponse - Unparsed response from Phase 3
 * @param {Object} params.normalizedEvaluation - Parsed object from Phase 4
 * @param {Object} params.officialScore - Rounded scores from Phase 5
 * @param {Object} params.structuredFeedback - Feedback object from Phase 6
 * @returns {Promise<Object>} Immutable persisted evaluation record
 */
export const persistEvaluationResults = async ({
  sessionId,
  evaluationContext,
  evaluationPackage,
  rawProviderResponse,
  normalizedEvaluation,
  officialScore,
  structuredFeedback,
}) => {
  if (!sessionId) {
    return {
      success: false,
      error: "Missing session ID for evaluation persistence.",
      errorCode: "MISSING_SESSION_ID",
    };
  }

  if (!officialScore || !structuredFeedback) {
    return {
      success: false,
      error: "Incomplete evaluation pipeline results for persistence.",
      errorCode: "INCOMPLETE_PIPELINE_RESULTS",
    };
  }

  const startTime = Date.now();

  try {
    // 1. Idempotency Check: Fetch Session Record
    const sessionRes = await SessionService.getWritingSession(sessionId);

    if (!sessionRes || !sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes?.error || "Writing session record not found.",
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    const session = sessionRes.data;

    // Idempotency: Return existing record if already persisted with evaluation data
    if (session.task1_eval_completed_at && session.task1_eval_data) {
      return {
        success: true,
        data: Object.freeze({
          sessionId,
          alreadyPersisted: true,
          persistedAt: session.task1_eval_completed_at,
          evaluationData: session.task1_eval_data,
        }),
      };
    }

    // 2. Assemble Complete Evaluation Record Payload
    const evalDataPayload = Object.freeze({
      overallBand: officialScore.overallBand,
      rawAverage: officialScore.rawAverage,
      criterionScores: officialScore.criterionScores,
      scoreBreakdown: officialScore.scoreBreakdown,
      feedback: structuredFeedback,
      versions: Object.freeze({
        persistenceVersion: PERSISTENCE_VERSION,
        scoringVersion: officialScore.metadata?.scoringVersion || "v1.0.0",
        feedbackVersion: structuredFeedback.metadata?.feedbackVersion || "v1.0.0",
        promptVersion: evaluationPackage?.versions?.PROMPT_VERSION || "v1.0.0",
        rubricVersion: evaluationPackage?.versions?.RUBRIC_VERSION || "v1.0.0",
        schemaVersion: evaluationPackage?.versions?.SCHEMA_VERSION || "v1.0.0",
      }),
      providerMetadata: Object.freeze({
        provider: rawProviderResponse?.provider || "openai",
        model: rawProviderResponse?.model || "gpt-4o",
        latencyMs: rawProviderResponse?.latencyMs || 0,
        usage: rawProviderResponse?.usage || {},
        requestId: rawProviderResponse?.requestId || "",
      }),
    });

    const updatePayload = {
      status: SESSION_STATUS.COMPLETED,
      task1_score: officialScore.overallBand,
      task1_eval_data: evalDataPayload,
      task1_eval_completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    };

    // 3. Execute Database Update
    const updateRes = await SessionService.updateWritingSession(
      sessionId,
      updatePayload
    );

    if (!updateRes || !updateRes.success || !updateRes.data) {
      throw new Error(
        updateRes?.error || "Failed to persist evaluation record to session store."
      );
    }

    const persistenceDurationMs = Date.now() - startTime;

    const persistedResult = Object.freeze({
      sessionId,
      alreadyPersisted: false,
      persistedAt: updatePayload.task1_eval_completed_at,
      overallBand: officialScore.overallBand,
      evaluationRecord: evalDataPayload,
      persistenceMetrics: Object.freeze({
        persistenceDurationMs,
        version: PERSISTENCE_VERSION,
      }),
    });

    return {
      success: true,
      data: persistedResult,
    };
  } catch (err) {
    console.error("[Rocket Evaluation Persistence Engine Error]", err);
    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred while persisting evaluation results.",
      errorCode: "PERSISTENCE_FAILED",
    };
  }
};

/**
 * Exported Evaluation Persistence Engine Gateway
 */
export const EvaluationPersistenceService = {
  PERSISTENCE_VERSION,
  persistEvaluationResults,
};

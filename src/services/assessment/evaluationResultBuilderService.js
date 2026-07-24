/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * EVALUATION RESULT BUILDER SERVICE (Sprint 4 - Phase 8)
 *
 * Transforms persisted evaluation aggregates into presentation-ready,
 * consumer-specific view models for Students, Faculty, Analytics, and History.
 *
 * DOES NOT call AI APIs, score bands, parse JSON, or persist to database.
 * ==========================================================
 */

export const BUILDER_VERSION = "v1.0.0";

/**
 * Build Student Report View Model (Clean student-facing presentation without internal AI prompt metadata)
 */
export const buildStudentReport = ({ evaluationContext, officialScore, structuredFeedback }) => {
  return Object.freeze({
    overallBand: officialScore.overallBand,
    criterionScores: Object.freeze({ ...officialScore.criterionScores }),
    summary: structuredFeedback.summary,
    strengths: Object.freeze([...structuredFeedback.strengths]),
    weaknesses: Object.freeze([...structuredFeedback.weaknesses]),
    feedback: Object.freeze({ ...structuredFeedback.criterionFeedback }),
    improvementPlan: Object.freeze([...structuredFeedback.improvementPlan]),
    wordCount: evaluationContext?.essay?.wordCount || 0,
    timeTakenSeconds: evaluationContext?.timestamps?.timeTakenSeconds || 0,
    completedAt: evaluationContext?.timestamps?.completedAt || new Date().toISOString(),
  });
};

/**
 * Build Faculty Report View Model (Includes student data + provider & prompt version metadata)
 */
export const buildFacultyReport = ({ evaluationContext, evaluationPackage, rawProviderResponse, officialScore, structuredFeedback }) => {
  const studentReport = buildStudentReport({ evaluationContext, officialScore, structuredFeedback });

  return Object.freeze({
    ...studentReport,
    studentId: evaluationContext?.studentId || "",
    sessionId: evaluationContext?.sessionId || "",
    questionId: evaluationContext?.questionId || "",
    questionTitle: evaluationContext?.question?.title || "",
    auditMetadata: Object.freeze({
      provider: rawProviderResponse?.provider || "openai",
      model: rawProviderResponse?.model || "gpt-4o",
      latencyMs: rawProviderResponse?.latencyMs || 0,
      totalTokens: rawProviderResponse?.usage?.totalTokens || 0,
      promptVersion: evaluationPackage?.versions?.PROMPT_VERSION || "v1.0.0",
      rubricVersion: evaluationPackage?.versions?.RUBRIC_VERSION || "v1.0.0",
      rawAverage: officialScore.rawAverage,
    }),
  });
};

/**
 * Build Analytics Payload View Model (Lightweight metric payload for performance dashboards)
 */
export const buildAnalyticsPayload = ({ evaluationContext, rawProviderResponse, officialScore }) => {
  return Object.freeze({
    sessionId: evaluationContext?.sessionId || "",
    studentId: evaluationContext?.studentId || "",
    overallBand: officialScore.overallBand,
    rawAverage: officialScore.rawAverage,
    criterionBands: Object.freeze({ ...officialScore.criterionScores }),
    wordCount: evaluationContext?.essay?.wordCount || 0,
    timeTakenSeconds: evaluationContext?.timestamps?.timeTakenSeconds || 0,
    providerLatencyMs: rawProviderResponse?.latencyMs || 0,
    providerTokens: rawProviderResponse?.usage?.totalTokens || 0,
    provider: rawProviderResponse?.provider || "openai",
    model: rawProviderResponse?.model || "gpt-4o",
    questionType: evaluationContext?.question?.type || "general",
  });
};

/**
 * Build History Record View Model (Compact item optimized for practice list rendering)
 */
export const buildHistoryRecord = ({ evaluationContext, officialScore }) => {
  return Object.freeze({
    sessionId: evaluationContext?.sessionId || "",
    questionId: evaluationContext?.questionId || "",
    questionCode: evaluationContext?.question?.code || "WT1-CBT",
    questionTitle: evaluationContext?.question?.title || "Writing Task 1",
    overallBand: officialScore.overallBand,
    submittedAt: evaluationContext?.timestamps?.submittedAt || new Date().toISOString(),
    completedAt: evaluationContext?.timestamps?.completedAt || new Date().toISOString(),
    status: "completed",
  });
};

/**
 * Transform completed pipeline objects into complete UI Consumer View Models object.
 *
 * @param {Object} pipelineData
 * @param {Object} pipelineData.evaluationContext
 * @param {Object} pipelineData.evaluationPackage
 * @param {Object} pipelineData.rawProviderResponse
 * @param {Object} pipelineData.normalizedEvaluation
 * @param {Object} pipelineData.officialScore
 * @param {Object} pipelineData.structuredFeedback
 * @param {Object} pipelineData.persistedRecord
 * @returns {Object} Immutable UI Consumer View Models
 */
export const buildEvaluationResults = ({
  evaluationContext,
  evaluationPackage,
  rawProviderResponse,
  normalizedEvaluation,
  officialScore,
  structuredFeedback,
  persistedRecord,
}) => {
  if (!officialScore || !structuredFeedback) {
    return {
      success: false,
      error: "Missing required scoring or feedback objects for result building.",
      errorCode: "MISSING_RESULT_DATA",
    };
  }

  try {
    const studentReport = buildStudentReport({
      evaluationContext,
      officialScore,
      structuredFeedback,
    });

    const facultyReport = buildFacultyReport({
      evaluationContext,
      evaluationPackage,
      rawProviderResponse,
      officialScore,
      structuredFeedback,
    });

    const analyticsPayload = buildAnalyticsPayload({
      evaluationContext,
      rawProviderResponse,
      officialScore,
    });

    const historyRecord = buildHistoryRecord({
      evaluationContext,
      officialScore,
    });

    const evaluationResultObject = Object.freeze({
      metadata: Object.freeze({
        builtAt: new Date().toISOString(),
        builderVersion: BUILDER_VERSION,
        persistedAt: persistedRecord?.persistedAt || new Date().toISOString(),
      }),
      studentReport,
      facultyReport,
      analyticsPayload,
      historyRecord,
    });

    return {
      success: true,
      data: evaluationResultObject,
    };
  } catch (err) {
    console.error("[Rocket Evaluation Result Builder Error]", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during result building.",
      errorCode: "RESULT_BUILDING_FAILED",
    };
  }
};

/**
 * Exported Evaluation Result Builder Gateway
 */
export const EvaluationResultBuilderService = {
  BUILDER_VERSION,
  buildStudentReport,
  buildFacultyReport,
  buildAnalyticsPayload,
  buildHistoryRecord,
  buildEvaluationResults,
};

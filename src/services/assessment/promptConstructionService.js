import {
  PromptTemplates,
  PROMPT_VERSIONS,
  EVALUATION_CONFIG_DEFAULTS,
  IELTS_TASK1_RUBRIC,
  TARGET_EVALUATION_SCHEMA,
  buildSystemPrompt,
  buildUserPrompt,
} from "./promptTemplates";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * PROMPT CONSTRUCTION ENGINE SERVICE (Sprint 4 - Phase 2)
 *
 * Responsible for generating a complete, version-controlled, provider-independent
 * Evaluation Package for the AI Evaluation System.
 *
 * DOES NOT call any AI APIs or perform evaluation directly.
 * ==========================================================
 */

/**
 * Construct an immutable Evaluation Package for AI providers.
 *
 * @param {Object} evaluationContext - Context payload supplied by EvaluationOrchestratorService
 * @returns {Object} Complete Evaluation Package
 */
export const constructEvaluationPackage = (evaluationContext) => {
  if (!evaluationContext) {
    return {
      success: false,
      error: "Missing evaluation context payload.",
      errorCode: "MISSING_CONTEXT",
    };
  }

  const { question, essay, sessionId, studentId, questionId } = evaluationContext;

  // 1. Validate Required Input Fields
  const errors = [];

  if (!question || !question.title) {
    errors.push("Question title is missing.");
  }
  if (!essay || !essay.text) {
    errors.push("Candidate essay response text is missing.");
  }

  if (errors.length > 0) {
    return {
      success: false,
      error: `Prompt construction validation failed: ${errors.join(" ")}`,
      errorCode: "VALIDATION_FAILED",
      validationErrors: errors,
    };
  }

  try {
    // 2. Generate System & User Prompts
    const systemPrompt = buildSystemPrompt();
    const userPrompt = buildUserPrompt({
      questionTitle: question.title,
      questionPrompt: question.prompt || "",
      questionType: question.type || "general",
      minWords: question.minWords || 150,
      essayText: essay.text,
      wordCount: essay.wordCount || 0,
    });

    // 3. Assemble Complete, Immutable Evaluation Package
    const evaluationPackage = Object.freeze({
      metadata: Object.freeze({
        sessionId: sessionId || "",
        studentId: studentId || "",
        questionId: questionId || "",
        constructedAt: new Date().toISOString(),
      }),
      systemPrompt,
      userPrompt,
      jsonSchema: Object.freeze(TARGET_EVALUATION_SCHEMA),
      ieltsRubric: Object.freeze(IELTS_TASK1_RUBRIC),
      versions: Object.freeze(PROMPT_VERSIONS),
      configuration: Object.freeze(EVALUATION_CONFIG_DEFAULTS),
    });

    return {
      success: true,
      data: evaluationPackage,
    };
  } catch (err) {
    console.error("[Rocket Prompt Construction Engine Error]", err);
    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred during prompt construction.",
      errorCode: "CONSTRUCTION_FAILED",
    };
  }
};

/**
 * Exported Prompt Construction Engine Gateway
 */
export const PromptConstructionService = {
  constructEvaluationPackage,
};

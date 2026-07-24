/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * FEEDBACK GENERATION ENGINE SERVICE (Sprint 4 - Phase 6)
 *
 * Transforms validated evaluation results into structured, educational feedback.
 * Produces actionable learning guidance for IELTS Task 1 candidates.
 *
 * DOES NOT call AI APIs, score bands, parse JSON, or save to database.
 * ==========================================================
 */

export const FEEDBACK_VERSION = "v1.0.0";
export const RUBRIC_VERSION = "v1.0.0";

/**
 * Remove duplicate items case-insensitively and trim strings
 */
const deduplicateStrings = (arr) => {
  if (!Array.isArray(arr)) return [];
  const seen = new Set();
  const result = [];

  for (const item of arr) {
    const trimmed = String(item || "").trim();
    if (!trimmed) continue;
    const lower = trimmed.toLowerCase();
    if (!seen.has(lower)) {
      seen.add(lower);
      result.push(trimmed);
    }
  }

  return result;
};

/**
 * Generate a structured, prioritized improvement plan
 */
export const buildPrioritizedImprovementPlan = (rawPlan, weaknesses, criterionScores) => {
  const dedupedPlan = deduplicateStrings(rawPlan);
  const items = [];

  if (dedupedPlan.length > 0) {
    dedupedPlan.forEach((action, idx) => {
      items.push({
        priority: idx + 1,
        focusArea: idx === 0 ? "Highest Priority" : idx === 1 ? "Secondary Focus" : "General Improvement",
        action,
      });
    });
  } else if (weaknesses && weaknesses.length > 0) {
    weaknesses.forEach((weakness, idx) => {
      items.push({
        priority: idx + 1,
        focusArea: `Improvement ${idx + 1}`,
        action: `Work on addressing: ${weakness}`,
      });
    });
  } else {
    items.push({
      priority: 1,
      focusArea: "General Practice",
      action: "Continue practicing IELTS Academic Task 1 reports with varied data charts.",
    });
  }

  return items;
};

/**
 * Generate structured educational feedback from normalized evaluation and official score.
 *
 * @param {Object} params
 * @param {Object} params.normalizedEvaluation - Output object from Phase 4 Response Processing Engine
 * @param {Object} params.officialScore - Output object from Phase 5 Scoring Engine
 * @returns {Object} Immutable structured feedback object
 */
export const generateStructuredFeedback = ({ normalizedEvaluation, officialScore }) => {
  if (!normalizedEvaluation) {
    return {
      success: false,
      error: "Missing normalized evaluation object for feedback generation.",
      errorCode: "MISSING_EVALUATION_OBJECT",
    };
  }

  try {
    const strengths = deduplicateStrings(normalizedEvaluation.strengths);
    const weaknesses = deduplicateStrings(normalizedEvaluation.weaknesses);
    const rawImprovementPlan = normalizedEvaluation.improvementPlan || [];
    const criterionScores = officialScore?.criterionScores || normalizedEvaluation.criterionScores || {};

    const prioritizedPlan = buildPrioritizedImprovementPlan(
      rawImprovementPlan,
      weaknesses,
      criterionScores
    );

    const structuredFeedback = Object.freeze({
      metadata: Object.freeze({
        generatedAt: new Date().toISOString(),
        feedbackVersion: FEEDBACK_VERSION,
        rubricVersion: RUBRIC_VERSION,
      }),
      strengths: Object.freeze(strengths),
      weaknesses: Object.freeze(weaknesses),
      criterionFeedback: Object.freeze({
        taskAchievement: normalizedEvaluation.feedback?.taskAchievement || "Task Achievement evaluation complete.",
        coherenceAndCohesion: normalizedEvaluation.feedback?.coherence || "Coherence & Cohesion evaluation complete.",
        lexicalResource: normalizedEvaluation.feedback?.vocabulary || "Lexical Resource evaluation complete.",
        grammaticalRangeAndAccuracy: normalizedEvaluation.feedback?.grammar || "Grammatical Range & Accuracy evaluation complete.",
      }),
      improvementPlan: Object.freeze(prioritizedPlan),
      summary: normalizedEvaluation.summary || "Evaluation completed successfully.",
    });

    return {
      success: true,
      data: structuredFeedback,
    };
  } catch (err) {
    console.error("[Rocket Feedback Generation Engine Error]", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during feedback generation.",
      errorCode: "FEEDBACK_GENERATION_FAILED",
    };
  }
};

/**
 * Exported Feedback Generation Engine Gateway
 */
export const FeedbackGenerationService = {
  FEEDBACK_VERSION,
  RUBRIC_VERSION,
  generateStructuredFeedback,
};

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * RESPONSE PROCESSING ENGINE SERVICE (Sprint 4 - Phase 4)
 *
 * Converts raw LLM provider responses into validated, normalized evaluation objects.
 * Acts as the trust boundary between external AI providers and the Rocket Platform.
 *
 * DOES NOT call AI APIs, score bands, generate feedback, or save to database.
 * ==========================================================
 */

export const PARSER_VERSION = "v1.0.0";

/**
 * Extract and clean JSON text from raw LLM output.
 * Handles safe recovery from markdown code fences (```json ... ```) and leading/trailing text.
 *
 * @param {string} rawText
 * @returns {Object} { cleanedText, recoveryPerformed }
 */
export const extractAndCleanJsonText = (rawText) => {
  if (typeof rawText !== "string" || !rawText.trim()) {
    return { cleanedText: "", recoveryPerformed: false };
  }

  let text = rawText.trim();
  let recoveryPerformed = false;

  // 1. Remove Markdown Code Block Fences
  const markdownJsonRegex = /```(?:json)?\s*([\s\S]*?)\s*```/i;
  const match = markdownJsonRegex.exec(text);

  if (match && match[1]) {
    text = match[1].trim();
    recoveryPerformed = true;
  }

  // 2. Strip leading non-JSON text before first '{' and trailing text after last '}'
  const firstBrace = text.indexOf("{");
  const lastBrace = text.lastIndexOf("}");

  if (firstBrace !== -1 && lastBrace !== -1 && (firstBrace > 0 || lastBrace < text.length - 1)) {
    text = text.substring(firstBrace, lastBrace + 1).trim();
    recoveryPerformed = true;
  }

  return { cleanedText: text, recoveryPerformed };
};

/**
 * Validate IELTS Score (0.0 to 9.0 in half-band 0.5 increments)
 */
export const isValidIELTSBandScore = (score) => {
  if (typeof score !== "number" || isNaN(score)) return false;
  if (score < 0 || score > 9.0) return false;
  const doubled = Math.round(score * 2);
  return Math.abs(score * 2 - doubled) < 0.001;
};

/**
 * Normalize raw parsed object into standardized evaluation structure
 */
export const normalizeEvaluationObject = (rawObj) => {
  if (!rawObj || typeof rawObj !== "object") return null;

  const rawCrit = rawObj.criterion_scores || rawObj.criterionScores || {};

  const parseScore = (val) => {
    const num = parseFloat(val);
    return isNaN(num) ? 0 : Math.round(num * 2) / 2;
  };

  const normalizeArray = (arr) => {
    if (Array.isArray(arr)) {
      return arr.map((item) => String(item || "").trim()).filter(Boolean);
    }
    if (typeof arr === "string" && arr.trim()) {
      return [arr.trim()];
    }
    return [];
  };

  return {
    overallBand: parseScore(rawObj.overall_band ?? rawObj.overallBand),
    criterionScores: {
      taskAchievement: parseScore(
        rawCrit.task_achievement ?? rawCrit.taskAchievement
      ),
      coherenceAndCohesion: parseScore(
        rawCrit.coherence_and_cohesion ?? rawCrit.coherenceAndCohesion
      ),
      lexicalResource: parseScore(
        rawCrit.lexical_resource ?? rawCrit.lexicalResource
      ),
      grammaticalRangeAndAccuracy: parseScore(
        rawCrit.grammatical_range_and_accuracy ??
          rawCrit.grammaticalRangeAndAccuracy
      ),
    },
    feedback: {
      taskAchievement: String(
        rawObj.task_achievement_feedback ||
          rawObj.feedback?.taskAchievement ||
          ""
      ).trim(),
      coherence: String(
        rawObj.coherence_feedback || rawObj.feedback?.coherence || ""
      ).trim(),
      vocabulary: String(
        rawObj.vocabulary_feedback || rawObj.feedback?.vocabulary || ""
      ).trim(),
      grammar: String(
        rawObj.grammar_feedback || rawObj.feedback?.grammar || ""
      ).trim(),
    },
    strengths: normalizeArray(rawObj.strengths),
    weaknesses: normalizeArray(rawObj.weaknesses),
    improvementPlan: normalizeArray(
      rawObj.improvement_plan || rawObj.improvementPlan
    ),
    summary: String(rawObj.summary || "").trim(),
  };
};

/**
 * Enforce strict IELTS business & schema validation rules
 */
export const validateIELTSBusinessRules = (normalizedObj) => {
  const errors = [];

  if (!isValidIELTSBandScore(normalizedObj.overallBand)) {
    errors.push(`Invalid overall band score '${normalizedObj.overallBand}'. Must be 0.0 to 9.0 in 0.5 increments.`);
  }

  const crit = normalizedObj.criterionScores;
  if (!isValidIELTSBandScore(crit.taskAchievement)) {
    errors.push(`Invalid Task Achievement score '${crit.taskAchievement}'.`);
  }
  if (!isValidIELTSBandScore(crit.coherenceAndCohesion)) {
    errors.push(`Invalid Coherence & Cohesion score '${crit.coherenceAndCohesion}'.`);
  }
  if (!isValidIELTSBandScore(crit.lexicalResource)) {
    errors.push(`Invalid Lexical Resource score '${crit.lexicalResource}'.`);
  }
  if (!isValidIELTSBandScore(crit.grammaticalRangeAndAccuracy)) {
    errors.push(`Invalid Grammatical Range & Accuracy score '${crit.grammaticalRangeAndAccuracy}'.`);
  }

  if (!normalizedObj.summary) {
    errors.push("Summary assessment text is missing or empty.");
  }
  if (normalizedObj.strengths.length === 0) {
    errors.push("Strengths array must contain at least one point.");
  }
  if (normalizedObj.weaknesses.length === 0) {
    errors.push("Weaknesses array must contain at least one point.");
  }

  return {
    valid: errors.length === 0,
    errors,
  };
};

/**
 * Process a raw AI Provider Response into a normalized, immutable evaluation object.
 *
 * @param {Object} rawProviderResponse - Response payload from Phase 3 AI Provider Engine
 * @returns {Object} Normalized evaluation result object
 */
export const processProviderResponse = (rawProviderResponse) => {
  if (!rawProviderResponse) {
    return {
      success: false,
      error: "Missing raw provider response payload for processing.",
      errorCode: "MISSING_PROVIDER_RESPONSE",
    };
  }

  const rawText = rawProviderResponse.rawContent || "";

  // 1. Extract & Clean JSON Text
  const { cleanedText, recoveryPerformed } = extractAndCleanJsonText(rawText);

  if (!cleanedText) {
    return {
      success: false,
      error: "Raw provider response content is empty.",
      errorCode: "EMPTY_RESPONSE_CONTENT",
    };
  }

  // 2. Parse JSON
  let parsedJson = null;
  try {
    parsedJson = JSON.parse(cleanedText);
  } catch (parseErr) {
    return {
      success: false,
      error: `JSON parsing failed: ${parseErr.message}`,
      errorCode: "JSON_PARSING_FAILED",
      cleanedText,
    };
  }

  // 3. Normalize Object Structures
  const normalizedObj = normalizeEvaluationObject(parsedJson);

  if (!normalizedObj) {
    return {
      success: false,
      error: "Parsed JSON could not be normalized into evaluation object.",
      errorCode: "NORMALIZATION_FAILED",
    };
  }

  // 4. Validate IELTS Business Rules
  const businessValidation = validateIELTSBusinessRules(normalizedObj);

  if (!businessValidation.valid) {
    return {
      success: false,
      error: `Evaluation validation failed: ${businessValidation.errors.join(" ")}`,
      errorCode: "BUSINESS_VALIDATION_FAILED",
      validationErrors: businessValidation.errors,
      normalizedObj,
    };
  }

  // 5. Construct Immutable Output Evaluation Object
  const processedEvaluation = Object.freeze({
    metadata: Object.freeze({
      processedAt: new Date().toISOString(),
      parserVersion: PARSER_VERSION,
      recoveryPerformed,
    }),
    overallBand: normalizedObj.overallBand,
    criterionScores: Object.freeze(normalizedObj.criterionScores),
    feedback: Object.freeze(normalizedObj.feedback),
    strengths: Object.freeze(normalizedObj.strengths),
    weaknesses: Object.freeze(normalizedObj.weaknesses),
    improvementPlan: Object.freeze(normalizedObj.improvementPlan),
    summary: normalizedObj.summary,
    rawProviderMetadata: Object.freeze({
      provider: rawProviderResponse.provider || "openai",
      model: rawProviderResponse.model || "gpt-4o",
      latencyMs: rawProviderResponse.latencyMs || 0,
      usage: rawProviderResponse.usage || {},
      requestId: rawProviderResponse.requestId || "",
    }),
  });

  return {
    success: true,
    data: processedEvaluation,
  };
};

/**
 * Exported Response Processing Engine Gateway
 */
export const ResponseProcessingService = {
  PARSER_VERSION,
  extractAndCleanJsonText,
  isValidIELTSBandScore,
  normalizeEvaluationObject,
  validateIELTSBusinessRules,
  processProviderResponse,
};

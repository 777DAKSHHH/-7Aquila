/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * SCORING ENGINE SERVICE (Sprint 4 - Phase 5)
 *
 * Transforms validated evaluation objects into official IELTS band scores.
 * Implements the official IELTS overall band score calculation and rounding algorithm.
 *
 * DOES NOT call AI APIs, parse JSON, or persist to database.
 * ==========================================================
 */

export const SCORING_VERSION = "v1.0.0";
export const RUBRIC_VERSION = "v1.0.0";

/**
 * Official IELTS Overall Band Score Rounding Algorithm
 *
 * Rules:
 * Average = (TA + CC + LR + GRA) / 4
 *
 * Decimal remainder rounding rules:
 * - If average ends in < .125 => rounds DOWN to .0
 * - If average ends in >= .125 and < .625 => rounds to .5
 * - If average ends in >= .625 => rounds UP to 1.0 (next whole number)
 *
 * Examples:
 * 6.0    => 6.0
 * 6.125  => 6.5
 * 6.25   => 6.5
 * 6.375  => 6.5
 * 6.5    => 6.5
 * 6.625  => 7.0
 * 6.75   => 7.0
 * 6.875  => 7.0
 *
 * @param {number} ta - Task Achievement score (0.0 - 9.0)
 * @param {number} cc - Coherence & Cohesion score (0.0 - 9.0)
 * @param {number} lr - Lexical Resource score (0.0 - 9.0)
 * @param {number} gra - Grammatical Range & Accuracy score (0.0 - 9.0)
 * @returns {Object} { overallBand, rawAverage }
 */
export const calculateIELTSOverallBand = (ta, cc, lr, gra) => {
  const scores = [ta, cc, lr, gra];

  // Validate inputs
  for (const s of scores) {
    if (typeof s !== "number" || isNaN(s) || s < 0 || s > 9.0) {
      throw new Error(`Invalid criterion score '${s}'. Must be between 0.0 and 9.0.`);
    }
  }

  const rawAverage = (ta + cc + lr + gra) / 4;
  const floorInt = Math.floor(rawAverage);
  const remainder = rawAverage - floorInt;

  let roundedBand = floorInt;

  if (remainder < 0.125) {
    roundedBand = floorInt;
  } else if (remainder < 0.625) {
    roundedBand = floorInt + 0.5;
  } else {
    roundedBand = floorInt + 1.0;
  }

  // Cap at 9.0 max
  roundedBand = Math.min(9.0, Math.max(0.0, roundedBand));

  return {
    overallBand: roundedBand,
    rawAverage: Math.round(rawAverage * 1000) / 1000,
  };
};

/**
 * Process normalized evaluation object into official Rocket IELTS scoring object.
 *
 * @param {Object} normalizedEvaluation - Output object from Phase 4 Response Processing Engine
 * @returns {Object} Official scoring object execution result
 */
export const calculateOfficialScore = (normalizedEvaluation) => {
  if (!normalizedEvaluation) {
    return {
      success: false,
      error: "Missing normalized evaluation payload for score calculation.",
      errorCode: "MISSING_EVALUATION_OBJECT",
    };
  }

  const crit = normalizedEvaluation.criterionScores || {};
  const ta = crit.taskAchievement;
  const cc = crit.coherenceAndCohesion;
  const lr = crit.lexicalResource;
  const gra = crit.grammaticalRangeAndAccuracy;

  if (
    typeof ta !== "number" ||
    typeof cc !== "number" ||
    typeof lr !== "number" ||
    typeof gra !== "number"
  ) {
    return {
      success: false,
      error: "Normalized evaluation object is missing required criterion scores.",
      errorCode: "INCOMPLETE_CRITERIA_SCORES",
    };
  }

  try {
    const { overallBand, rawAverage } = calculateIELTSOverallBand(ta, cc, lr, gra);

    const officialScoreObject = Object.freeze({
      metadata: Object.freeze({
        scoredAt: new Date().toISOString(),
        scoringVersion: SCORING_VERSION,
        rubricVersion: RUBRIC_VERSION,
      }),
      overallBand,
      rawAverage,
      criterionScores: Object.freeze({
        taskAchievement: ta,
        coherenceAndCohesion: cc,
        lexicalResource: lr,
        grammaticalRangeAndAccuracy: gra,
      }),
      scoreBreakdown: Object.freeze({
        taskAchievementWeight: 0.25,
        coherenceAndCohesionWeight: 0.25,
        lexicalResourceWeight: 0.25,
        grammaticalRangeAndAccuracyWeight: 0.25,
      }),
      validationReport: Object.freeze({
        valid: true,
        errors: [],
      }),
    });

    return {
      success: true,
      data: officialScoreObject,
    };
  } catch (err) {
    console.error("[Rocket Scoring Engine Error]", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during score calculation.",
      errorCode: "SCORE_CALCULATION_FAILED",
    };
  }
};

/**
 * Exported Scoring Engine Gateway
 */
export const ScoringEngineService = {
  SCORING_VERSION,
  RUBRIC_VERSION,
  calculateIELTSOverallBand,
  calculateOfficialScore,
};

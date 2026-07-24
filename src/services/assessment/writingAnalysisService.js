/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * WRITING ANALYSIS SERVICE
 *
 * Centralized engine for analyzing student essays & writing metrics.
 * Fast O(n) calculations for live keystroke updates & AI evaluation prep.
 * ==========================================================
 */

/**
 * Perform comprehensive analysis on essay text.
 *
 * @param {string} text - Essay content
 * @param {number} minimumRequired - Minimum word requirement (default 150 for Task 1)
 * @returns {Object} Structured analysis object
 */
export const analyzeWritingText = (text = "", minimumRequired = 150) => {
  // Edge Case: Empty, null, or non-string inputs
  if (typeof text !== "string" || !text) {
    return {
      wordCount: 0,
      characterCount: 0,
      paragraphCount: 0,
      sentenceCount: 0,
      minimumRequired,
      meetsRequirement: false,
      progressPercentage: 0,
      status: "empty", // 'empty' | 'writing_started' | 'below_requirement' | 'requirement_met'
    };
  }

  const trimmed = text.trim();
  const characterCount = text.length;

  if (trimmed.length === 0) {
    return {
      wordCount: 0,
      characterCount,
      paragraphCount: 0,
      sentenceCount: 0,
      minimumRequired,
      meetsRequirement: false,
      progressPercentage: 0,
      status: "empty",
    };
  }

  // Fast O(n) Whitespace Normalization:
  // Splits on one or more contiguous whitespace characters (spaces, tabs, newlines, non-breaking spaces)
  const words = trimmed.split(/\s+/);
  const wordCount = words.length;

  // Paragraph Count: split by double newlines or non-empty blocks
  const paragraphs = text
    .split(/\n\s*\n/)
    .filter((p) => p.trim().length > 0);
  const paragraphCount = Math.max(1, paragraphs.length);

  // Sentence Count: split by terminal punctuation (. ! ?)
  const sentences = trimmed.split(/[.!?]+/).filter((s) => s.trim().length > 0);
  const sentenceCount = sentences.length;

  const meetsRequirement = wordCount >= minimumRequired;
  const progressPercentage = Math.min(
    100,
    Math.round((wordCount / minimumRequired) * 100)
  );

  // Categorize writing status
  let status = "below_requirement";
  if (wordCount === 0) {
    status = "empty";
  } else if (wordCount < 15) {
    status = "writing_started";
  } else if (meetsRequirement) {
    status = "requirement_met";
  }

  return {
    wordCount,
    characterCount,
    paragraphCount,
    sentenceCount,
    minimumRequired,
    meetsRequirement,
    progressPercentage,
    status,
  };
};

/**
 * Exported Writing Analysis Gateway
 */
export const WritingAnalysisService = {
  analyzeWritingText,
};

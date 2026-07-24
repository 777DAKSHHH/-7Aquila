/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * SUBMISSION VALIDATION SERVICE
 *
 * Centralized validation engine for pre-submission checks.
 * Guarantees that every submission attempt meets required criteria
 * before proceeding to submission API or session finalization.
 * ==========================================================
 */

/**
 * Perform comprehensive pre-submission validation.
 *
 * @param {Object} params
 * @param {Object} params.session - Loaded writing_sessions database record
 * @param {Object} params.question - Loaded writing_task1_questions database record
 * @param {string} params.answer - Current essay response text
 * @param {Object} params.writingAnalysis - Metrics from WritingAnalysisService
 * @param {Object} params.autosaveState - State from AutoSaveService
 * @param {boolean} params.isExpired - Timer expiration status
 * @param {number} params.remainingSeconds - Remaining countdown seconds
 * @returns {Object} Structured validation result
 */
export const validateWritingSubmission = ({
  session,
  question,
  answer,
  writingAnalysis,
  autosaveState,
  isExpired,
  remainingSeconds,
}) => {
  const errors = [];
  const warnings = [];
  let blockingReason = null;

  // 1. Validate Session Existence & State
  if (!session || !session.id) {
    errors.push("Invalid or missing writing session.");
    blockingReason = "Writing session data is missing.";
  } else if (session.status === "submitted" || session.is_draft === false) {
    errors.push("This session has already been submitted and cannot be edited.");
    blockingReason = "Session already submitted.";
  }

  // 2. Validate Question Existence
  if (!question || !question.id) {
    errors.push("Missing associated writing question data.");
    if (!blockingReason) blockingReason = "Question data is missing.";
  }

  // 3. Validate Answer Text & Word Count
  const text = (answer || "").trim();
  if (!text) {
    errors.push("Essay response cannot be empty.");
    if (!blockingReason) blockingReason = "Response text is empty.";
  }

  const wordCount = writingAnalysis?.wordCount || 0;
  const minWords = writingAnalysis?.minimumRequired || 150;

  if (text.length > 0 && wordCount < minWords) {
    warnings.push(
      `Your response has ${wordCount} words, which is below the recommended minimum of ${minWords} words.`
    );
  }

  // 4. Validate Pending / In-Flight Autosave
  if (
    autosaveState &&
    (autosaveState.status === "saving" || autosaveState.status === "typing")
  ) {
    errors.push("Pending edits are currently being saved. Please wait a moment.");
    if (!blockingReason) blockingReason = "Autosave in progress.";
  }

  if (autosaveState && autosaveState.status === "failed") {
    warnings.push("Latest edits failed to autosave to server. Please check your connection.");
  }

  // 5. Validate Timer & Expiration State
  if (isExpired || remainingSeconds <= 0) {
    warnings.push("Examination time limit has expired.");
  }

  const isValid = errors.length === 0;
  const canSubmit = isValid;

  return {
    isValid,
    canSubmit,
    blockingReason,
    errors,
    warnings,
    validatedAt: new Date(),
  };
};

/**
 * Exported Submission Validation Engine
 */
export const SubmissionValidationService = {
  validateTask1Submission: validateWritingSubmission,
  validateTask2Submission: validateWritingSubmission,
};

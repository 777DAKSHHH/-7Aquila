import { useMemo, useCallback } from "react";
import { SubmissionValidationService } from "../../../../../services/assessment/submissionValidationService";

/**
 * Custom hook for Task 1 Submission Validation Engine (Sprint 3 - Phase 1).
 *
 * Responsibilities:
 * - Memoizes structured validation results for Task 1 pre-submission checks.
 * - Evaluates session status, question existence, answer text, word count, autosave in-flight status, and timer expiration.
 * - Exposes validationResult, canSubmit, blockingReason, errors, warnings, and manual validateNow helper.
 */
export const useTask1SubmissionValidation = ({
  session,
  question,
  answer,
  writingAnalysis,
  autosaveState,
  isExpired,
  remainingSeconds,
}) => {
  // Memoized submission validation result
  const validationResult = useMemo(() => {
    return SubmissionValidationService.validateTask1Submission({
      session,
      question,
      answer,
      writingAnalysis,
      autosaveState,
      isExpired,
      remainingSeconds,
    });
  }, [
    session,
    question,
    answer,
    writingAnalysis,
    autosaveState,
    isExpired,
    remainingSeconds,
  ]);

  // On-demand validation evaluation helper
  const validateNow = useCallback(() => {
    return SubmissionValidationService.validateTask1Submission({
      session,
      question,
      answer,
      writingAnalysis,
      autosaveState,
      isExpired,
      remainingSeconds,
    });
  }, [
    session,
    question,
    answer,
    writingAnalysis,
    autosaveState,
    isExpired,
    remainingSeconds,
  ]);

  return {
    validationResult,
    isValid: validationResult.isValid,
    canSubmit: validationResult.canSubmit,
    blockingReason: validationResult.blockingReason,
    errors: validationResult.errors,
    warnings: validationResult.warnings,
    validateNow,
  };
};

export default useTask1SubmissionValidation;

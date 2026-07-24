import { useMemo, useCallback } from "react";
import { SubmissionValidationService } from "../../../../../services/assessment/submissionValidationService";

/**
 * Custom hook for Task 2 Submission Validation Engine.
 */
export const useTask2SubmissionValidation = ({
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
    return SubmissionValidationService.validateTask2Submission({
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
    return SubmissionValidationService.validateTask2Submission({
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

export default useTask2SubmissionValidation;

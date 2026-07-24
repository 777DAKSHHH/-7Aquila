import { useState, useCallback } from "react";
import {
  SubmissionEngineService,
  SUBMISSION_STATES,
} from "../../../../../services/assessment/submissionService";

/**
 * Custom hook for Task 2 Submission Engine.
 */
export const useTask2Submission = ({
  sessionId,
  answer,
  wordCount,
  forceSave,
  validationResult,
}) => {
  const [status, setStatus] = useState(SUBMISSION_STATES.IDLE);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLocked, setIsLocked] = useState(false);
  const [error, setError] = useState(null);
  const [submissionData, setSubmissionData] = useState(null);

  const submitTask2Session = useCallback(async () => {
    // Idempotency & Concurrency Guard: reject if already submitting or locked
    if (isSubmitting || isLocked) {
      console.warn("[Rocket Submission Engine] Prevented duplicate submission attempt.");
      return { success: false, error: "Submission already in progress or completed." };
    }

    setIsSubmitting(true);
    setError(null);
    setStatus(SUBMISSION_STATES.PREPARING);

    try {
      const result = await SubmissionEngineService.executeSubmissionPipeline({
        sessionId,
        answer,
        wordCount,
        forceSave,
        validationResult,
        onStatusChange: (newStatus) => {
          setStatus(newStatus);
        },
      });

      if (!result.success) {
        setError(result.error || "Submission pipeline failed.");
        setStatus(SUBMISSION_STATES.FAILED);
        setIsSubmitting(false);
        return result;
      }

      // Success & Lock Execution
      setSubmissionData(result.data);
      setIsLocked(true);
      setStatus(SUBMISSION_STATES.COMPLETED);
      setIsSubmitting(false);

      return result;
    } catch (err) {
      console.error("[useTask2Submission Error]", err);
      const errMsg = err.message || "An unexpected error occurred during submission.";
      setError(errMsg);
      setStatus(SUBMISSION_STATES.FAILED);
      setIsSubmitting(false);
      return { success: false, error: errMsg };
    }
  }, [sessionId, answer, wordCount, forceSave, validationResult, isSubmitting, isLocked]);

  return {
    status,
    isSubmitting,
    isLocked,
    error,
    submissionData,
    submitTask2Session,
  };
};

export default useTask2Submission;

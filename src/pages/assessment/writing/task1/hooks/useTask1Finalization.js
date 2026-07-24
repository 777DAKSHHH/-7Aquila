import { useState, useEffect, useCallback, useRef } from "react";
import {
  SessionFinalizationService,
  FINALIZATION_STATES,
} from "../../../../../services/assessment/sessionFinalizationService";
import { SUBMISSION_STATES } from "../../../../../services/assessment/submissionService";

/**
 * Custom hook for Task 1 Session Finalization Engine (Sprint 3 - Phase 3).
 *
 * Responsibilities:
 * - Automatically triggers finalization when Submission Engine reports completion.
 * - Calculates final session statistics (word count, time taken, remaining time).
 * - Updates database status to 'completed' via SessionFinalizationService.
 * - Pauses timer ticks, disables autosave, and locks session runtime lifecycle.
 * - Prevents duplicate finalization (Idempotent).
 */
export const useTask1Finalization = ({
  sessionId,
  wordCount,
  remainingSeconds,
  durationSeconds,
  submissionStatus,
  pauseTimer,
}) => {
  const [finalizationStatus, setFinalizationStatus] = useState(
    FINALIZATION_STATES.IDLE
  );
  const [isFinalized, setIsFinalized] = useState(false);
  const [finalizedSession, setFinalizedSession] = useState(null);
  const [error, setError] = useState(null);

  const isExecutingRef = useRef(false);

  const finalizeSession = useCallback(async () => {
    if (!sessionId || isExecutingRef.current || isFinalized) {
      return;
    }

    isExecutingRef.current = true;
    setFinalizationStatus(FINALIZATION_STATES.FINALIZING);
    setError(null);

    // Stop timer ticks
    if (typeof pauseTimer === "function") {
      pauseTimer();
    }

    try {
      const res = await SessionFinalizationService.finalizeWritingSession({
        sessionId,
        wordCount,
        remainingSeconds,
        durationSeconds,
      });

      if (!res.success) {
        setError(res.error || "Session finalization failed.");
        setFinalizationStatus(FINALIZATION_STATES.FAILED);
        isExecutingRef.current = false;
        return res;
      }

      setFinalizedSession(res.data);
      setIsFinalized(true);
      setFinalizationStatus(FINALIZATION_STATES.COMPLETED);
      isExecutingRef.current = false;

      return res;
    } catch (err) {
      console.error("[useTask1Finalization Error]", err);
      const errMsg = err.message || "An error occurred during finalization.";
      setError(errMsg);
      setFinalizationStatus(FINALIZATION_STATES.FAILED);
      isExecutingRef.current = false;
      return { success: false, error: errMsg };
    }
  }, [sessionId, wordCount, remainingSeconds, durationSeconds, pauseTimer, isFinalized]);

  // Watch submission status to auto-trigger finalization
  useEffect(() => {
    if (
      submissionStatus === SUBMISSION_STATES.COMPLETED &&
      !isFinalized &&
      !isExecutingRef.current
    ) {
      finalizeSession();
    }
  }, [submissionStatus, isFinalized, finalizeSession]);

  return {
    finalizationStatus,
    isFinalized,
    finalizedSession,
    error,
    finalizeSession,
  };
};

export default useTask1Finalization;

import { useState, useEffect, useCallback, useRef } from "react";
import {
  EvaluationPreparationService,
  PREP_STATES,
} from "../../../../../services/assessment/evaluationPreparationService";
import { FINALIZATION_STATES } from "../../../../../services/assessment/sessionFinalizationService";

/**
 * Custom hook for Task 1 Evaluation Preparation Engine (Sprint 3 - Phase 5).
 *
 * Responsibilities:
 * - Listens for session finalization completion.
 * - Validates evaluation prerequisites and transitions session status to 'evaluating'.
 * - Serves as handoff boundary to Sprint 4 AI Evaluation System (without calling any AI APIs).
 */
export const useTask1EvaluationPrep = ({
  sessionId,
  isFinalized,
  finalizationStatus,
}) => {
  const [prepStatus, setPrepStatus] = useState(PREP_STATES.IDLE);
  const [isPreparedForEval, setIsPreparedForEval] = useState(false);
  const [error, setError] = useState(null);

  const isExecutingRef = useRef(false);

  const prepareForEvaluation = useCallback(async () => {
    if (!sessionId || isExecutingRef.current || isPreparedForEval) {
      return;
    }

    isExecutingRef.current = true;
    setPrepStatus(PREP_STATES.PREPARING);
    setError(null);

    try {
      const res =
        await EvaluationPreparationService.prepareSessionForEvaluation(
          sessionId
        );

      if (!res.success) {
        setError(res.error || "Evaluation preparation failed.");
        setPrepStatus(PREP_STATES.FAILED);
        isExecutingRef.current = false;
        return res;
      }

      setIsPreparedForEval(true);
      setPrepStatus(PREP_STATES.READY);
      isExecutingRef.current = false;

      return res;
    } catch (err) {
      console.error("[useTask1EvaluationPrep Error]", err);
      const errMsg =
        err.message || "An error occurred during evaluation preparation.";
      setError(errMsg);
      setPrepStatus(PREP_STATES.FAILED);
      isExecutingRef.current = false;
      return { success: false, error: errMsg };
    }
  }, [sessionId, isPreparedForEval]);

  // Auto-trigger handoff preparation when session finalization completes
  useEffect(() => {
    if (
      (isFinalized || finalizationStatus === FINALIZATION_STATES.COMPLETED) &&
      !isPreparedForEval &&
      !isExecutingRef.current
    ) {
      prepareForEvaluation();
    }
  }, [isFinalized, finalizationStatus, isPreparedForEval, prepareForEvaluation]);

  return {
    prepStatus,
    isPreparedForEval,
    error,
    prepareForEvaluation,
  };
};

export default useTask1EvaluationPrep;

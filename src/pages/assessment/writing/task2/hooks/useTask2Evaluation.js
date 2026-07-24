import { useState, useCallback } from "react";
import {
  EvaluationOrchestratorService,
  ORCHESTRATOR_STATES,
} from "../../../../../services/assessment/evaluationOrchestratorService";

/**
 * Custom hook for Task 2 Evaluation Orchestrator.
 */
export const useTask2Evaluation = ({ sessionId, currentUserId }) => {
  const [evaluationStatus, setEvaluationStatus] = useState(
    ORCHESTRATOR_STATES.IDLE
  );
  const [isEvaluating, setIsEvaluating] = useState(false);
  const [evaluationData, setEvaluationData] = useState(null);
  const [error, setError] = useState(null);

  const startEvaluation = useCallback(async () => {
    if (!sessionId || isEvaluating) {
      console.warn("[Rocket Evaluation Orchestrator] Evaluation already in progress or session missing.");
      return { success: false, error: "Evaluation already in progress." };
    }

    setIsEvaluating(true);
    setError(null);
    setEvaluationStatus(ORCHESTRATOR_STATES.PREPARING);

    try {
      const res = await EvaluationOrchestratorService.orchestrateEvaluation({
        sessionId,
        currentUserId,
        onStatusChange: (newStatus) => {
          setEvaluationStatus(newStatus);
        },
      });

      if (!res.success) {
        setError(res.error || "Evaluation orchestration failed.");
        setEvaluationStatus(ORCHESTRATOR_STATES.FAILED);
        setIsEvaluating(false);
        return res;
      }

      setEvaluationData(res.data);
      setEvaluationStatus(ORCHESTRATOR_STATES.COMPLETED);
      setIsEvaluating(false);
      return res;
    } catch (err) {
      console.error("[useTask2Evaluation Error]", err);
      const errMsg = err.message || "An unexpected error occurred during evaluation.";
      setError(errMsg);
      setEvaluationStatus(ORCHESTRATOR_STATES.FAILED);
      setIsEvaluating(false);
      return { success: false, error: errMsg };
    }
  }, [sessionId, currentUserId, isEvaluating]);

  return {
    evaluationStatus,
    isEvaluating,
    evaluationData,
    error,
    startEvaluation,
  };
};

export default useTask2Evaluation;

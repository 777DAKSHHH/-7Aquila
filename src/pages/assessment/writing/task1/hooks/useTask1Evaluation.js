import { useState, useCallback } from "react";
import {
  EvaluationOrchestratorService,
  ORCHESTRATOR_STATES,
} from "../../../../../services/assessment/evaluationOrchestratorService";

/**
 * Custom hook for Task 1 Evaluation Orchestrator (Sprint 4 - Phase 1).
 *
 * Responsibilities:
 * - Single entry point for triggering AI Evaluation System orchestration.
 * - Manages evaluation status state machine ('idle' | 'preparing' | 'running' | 'completed' | 'failed').
 * - Prevents duplicate concurrent evaluation requests.
 * - Exposes startEvaluation helper and structured evaluation context data.
 */
export const useTask1Evaluation = ({ sessionId, currentUserId }) => {
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
      console.error("[useTask1Evaluation Error]", err);
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

export default useTask1Evaluation;

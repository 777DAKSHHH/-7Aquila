import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import { supabase } from "../../../../../supabaseClient";
import { SessionRecoveryService } from "../../../../../services/assessment/sessionRecoveryService";
import { WritingAnalysisService } from "../../../../../services/assessment/writingAnalysisService";
import useTask1Timer from "./useTask1Timer";
import useTask1Autosave from "./useTask1Autosave";
import useTask1SubmissionValidation from "./useTask1SubmissionValidation";
import useTask1Submission from "./useTask1Submission";
import useTask1Finalization from "./useTask1Finalization";
import useTask1Confirmation from "./useTask1Confirmation";
import useTask1EvaluationPrep from "./useTask1EvaluationPrep";
import useTask1Evaluation from "./useTask1Evaluation";
import { TASK1_DEFAULTS } from "../constants/task1Constants";

/**
 * Custom hook for Writing Task 1 Session, Question Rendering, Timer Engine, Writing Analysis, Autosave, Recovery Orchestrator, Submission Validation, Submission Engine, Session Finalization, Submission Confirmation, Evaluation Preparation, & Evaluation Orchestrator (Sprint 4 - Phase 1 Complete).
 *
 * Responsibilities:
 * 1. Delegates session loading & recovery sequence to SessionRecoveryService (Recovery Orchestrator).
 * 2. Restores session, question, asset URL, answer text, timer, and analysis metrics in a single pass.
 * 3. Eliminates race conditions during startup/reload.
 * 4. Integrates useTask1Timer for drift-free countdown & DB sync.
 * 5. Integrates WritingAnalysisService for live O(n) essay statistics & word counting.
 * 6. Integrates useTask1Autosave for debounced persistence, state machine, & retry strategy.
 * 7. Integrates useTask1SubmissionValidation for pre-submission checks & blocking conditions.
 * 8. Integrates useTask1Submission for executing autosave flush, final persistence, and locking submission.
 * 9. Integrates useTask1Finalization for calculating final session statistics, updating status to completed, and locking runtime lifecycle.
 * 10. Integrates useTask1Confirmation for formatting examination receipt payload and enforcing Back-button/reload read-only protection.
 * 11. Integrates useTask1EvaluationPrep for handoff validation & setting status to 'evaluating' for Sprint 4.
 * 12. Integrates useTask1Evaluation for orchestrating AI evaluation context readiness and pipeline execution.
 */
export const useTask1Session = () => {
  const [searchParams] = useSearchParams();
  const { user } = useAuth();

  const sessionId = searchParams.get("session");

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isIncomplete, setIsIncomplete] = useState(false);
  const [isRecovered, setIsRecovered] = useState(false);
  const [session, setSession] = useState(null);
  const [question, setQuestion] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [imageLoading, setImageLoading] = useState(true);
  const [imageError, setImageError] = useState(false);
  const [answer, setAnswer] = useState("");

  const loadSessionEngine = useCallback(async () => {
    setLoading(true);
    setError(null);
    setIsIncomplete(false);
    setImageError(false);
    setImageLoading(true);
    setIsRecovered(false);

    // Resolve authenticated student ID (with dev fallback)
    let currentUserId = user?.id;
    if (!currentUserId) {
      try {
        const { data: authData } = await supabase.auth.getUser();
        currentUserId = authData?.user?.id;
      } catch (e) {
        console.warn("Could not fetch auth user:", e);
      }
    }
    if (!currentUserId) {
      currentUserId = "00000000-0000-0000-0000-000000000000";
    }

    // Execute Recovery Orchestrator
    const recoveryRes = await SessionRecoveryService.orchestrateSessionRecovery({
      sessionId,
      currentUserId,
    });

    if (!recoveryRes.success || !recoveryRes.data) {
      setError(recoveryRes.error || "Failed to recover writing session.");
      setLoading(false);
      return;
    }

    const {
      session: sessionData,
      question: questionData,
      imageUrl: resolvedImageUrl,
      restoredAnswer,
      isIncomplete: incompleteFlag,
    } = recoveryRes.data;

    // Apply recovered state deterministically
    setSession(sessionData);
    setQuestion(questionData);
    setImageUrl(resolvedImageUrl);
    if (!resolvedImageUrl) {
      setImageLoading(false);
    }
    setAnswer(restoredAnswer);
    setIsIncomplete(incompleteFlag);
    setIsRecovered(true);
    setLoading(false);
  }, [sessionId, user]);

  useEffect(() => {
    loadSessionEngine();
  }, [loadSessionEngine]);

  // Image loading event handlers
  const handleImageLoad = useCallback(() => {
    setImageLoading(false);
    setImageError(false);
  }, []);

  const handleImageError = useCallback(() => {
    setImageLoading(false);
    setImageError(true);
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  // Formatted metadata object for Question Rendering Engine
  const formattedMetadata = useMemo(() => {
    if (!question) return null;

    const rawType = question.question_type || question.type || "general";

    return {
      title:
        question.title ||
        question.question_title ||
        TASK1_DEFAULTS.DEFAULT_TITLE,
      prompt:
        question.prompt ||
        question.question_prompt ||
        question.description ||
        TASK1_DEFAULTS.DEFAULT_INSTRUCTIONS,
      code:
        question.question_code ||
        question.code ||
        (question.id ? `WT1-${question.id.slice(0, 6).toUpperCase()}` : "WT1-CBT"),
      questionType: rawType,
      questionTypeLabel:
        rawType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      difficulty: (question.difficulty || "medium").toLowerCase(),
      minWords: question.min_words || TASK1_DEFAULTS.MIN_WORD_COUNT,
      timeLimitMinutes:
        question.time_limit_minutes || TASK1_DEFAULTS.TIME_LIMIT_MINUTES,
      module: question.module || TASK1_DEFAULTS.MODULE,
    };
  }, [question]);

  // Sprint 2 Phase 3: Integrate Writing Timer Engine
  const initialTimeSeconds = session?.task1_time_seconds || 0;
  const timeLimitSeconds = formattedMetadata
    ? formattedMetadata.timeLimitMinutes * 60
    : TASK1_DEFAULTS.TIME_LIMIT_SECONDS;

  const timerEngine = useTask1Timer({
    sessionId: loading ? null : sessionId,
    initialTimeSeconds,
    duration: timeLimitSeconds,
  });

  // Sprint 2 Phase 4: Integrate Writing Analysis Engine (Word Count)
  const writingAnalysis = useMemo(() => {
    const minWords = formattedMetadata?.minWords || TASK1_DEFAULTS.MIN_WORD_COUNT;
    return WritingAnalysisService.analyzeWritingText(answer, minWords);
  }, [answer, formattedMetadata?.minWords]);

  // Sprint 2 Phase 5: Integrate Autosave Engine
  const { autosaveState, forceSave, manualRetry } = useTask1Autosave({
    sessionId: loading ? null : sessionId,
    answer,
    wordCount: writingAnalysis.wordCount,
    session,
  });

  // Sprint 3 Phase 1: Integrate Submission Validation Engine
  const { validationResult, canSubmit, blockingReason, validateNow } =
    useTask1SubmissionValidation({
      session,
      question,
      answer,
      writingAnalysis,
      autosaveState,
      isExpired: timerEngine.isExpired,
      remainingSeconds: timerEngine.remainingSeconds,
    });

  // Sprint 3 Phase 2: Integrate Submission Engine
  const {
    status: submissionStatus,
    isSubmitting,
    isLocked,
    error: submissionError,
    submitTask1Session,
  } = useTask1Submission({
    sessionId: loading ? null : sessionId,
    answer,
    wordCount: writingAnalysis.wordCount,
    forceSave,
    validationResult,
  });

  // Sprint 3 Phase 3: Integrate Session Finalization Engine
  const {
    finalizationStatus,
    isFinalized,
    finalizedSession,
    error: finalizationError,
    finalizeSession,
  } = useTask1Finalization({
    sessionId: loading ? null : sessionId,
    wordCount: writingAnalysis.wordCount,
    remainingSeconds: timerEngine.remainingSeconds,
    durationSeconds: timeLimitSeconds,
    submissionStatus,
    pauseTimer: timerEngine.pauseTimer,
  });

  // Sprint 3 Phase 4: Integrate Submission Confirmation Engine
  const { showConfirmation, receiptData } = useTask1Confirmation({
    session,
    question,
    formattedMetadata,
    isFinalized,
    finalizedSession,
    writingAnalysis,
    remainingSeconds: timerEngine.remainingSeconds,
    durationSeconds: timeLimitSeconds,
  });

  // Sprint 3 Phase 5: Integrate Evaluation Preparation Engine
  const { prepStatus, isPreparedForEval } = useTask1EvaluationPrep({
    sessionId: loading ? null : sessionId,
    isFinalized,
    finalizationStatus,
  });

  // Sprint 4 Phase 1: Integrate Evaluation Orchestrator Engine
  const {
    evaluationStatus,
    isEvaluating,
    evaluationData,
    error: evaluationError,
    startEvaluation,
  } = useTask1Evaluation({
    sessionId: loading ? null : sessionId,
    currentUserId: user?.id,
  });

  return {
    sessionId,
    loading,
    error,
    isIncomplete,
    isRecovered,
    clearError,
    session,
    question,
    formattedMetadata,
    imageUrl,
    imageLoading,
    imageError,
    handleImageLoad,
    handleImageError,
    answer,
    setAnswer,
    // Timer Engine metrics & controls
    remainingSeconds: timerEngine.remainingSeconds,
    formattedTime: timerEngine.formattedTime,
    warningState: timerEngine.warningState,
    isExpired: timerEngine.isExpired,
    pauseTimer: timerEngine.pauseTimer,
    resumeTimer: timerEngine.resumeTimer,
    // Writing Analysis Engine metrics
    writingAnalysis,
    // Autosave Engine state & controls
    autosaveState,
    forceSave,
    manualRetry,
    // Submission Validation Engine metrics & controls
    validationResult,
    canSubmit,
    blockingReason,
    validateNow,
    // Submission Engine state & controls
    submissionStatus,
    isSubmitting,
    isLocked,
    submissionError,
    submitTask1Session,
    // Session Finalization Engine state & controls
    finalizationStatus,
    isFinalized,
    finalizedSession,
    finalizationError,
    finalizeSession,
    // Submission Confirmation Engine state & data
    showConfirmation,
    receiptData,
    // Evaluation Preparation Engine state
    prepStatus,
    isPreparedForEval,
    // Evaluation Orchestrator Engine state & controls
    evaluationStatus,
    isEvaluating,
    evaluationData,
    evaluationError,
    startEvaluation,
    reloadSession: loadSessionEngine,
  };
};

export default useTask1Session;

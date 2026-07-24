import { useState, useEffect, useCallback, useMemo } from "react";
import { useSearchParams } from "react-router-dom";
import { useAuth } from "../../../../../contexts/AuthContext";
import { supabase } from "../../../../../supabaseClient";
import { SessionRecoveryService } from "../../../../../services/assessment/sessionRecoveryService";
import { WritingAnalysisService } from "../../../../../services/assessment/writingAnalysisService";
import useTask2Timer from "./useTask2Timer";
import useTask2Autosave from "./useTask2Autosave";
import useTask2SubmissionValidation from "./useTask2SubmissionValidation";
import useTask2Submission from "./useTask2Submission";
import useTask2Finalization from "./useTask2Finalization";
import useTask2Confirmation from "./useTask2Confirmation";
import useTask2EvaluationPrep from "./useTask2EvaluationPrep";
import useTask2Evaluation from "./useTask2Evaluation";
import { TASK2_DEFAULTS } from "../constants/task2Constants";

/**
 * Custom hook for Writing Task 2 Session, Question Rendering, Timer Engine, Writing Analysis, Autosave, Recovery Orchestrator, Submission Validation, Submission Engine, Session Finalization, Submission Confirmation, Evaluation Preparation, & Evaluation Orchestrator.
 */
export const useTask2Session = () => {
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

    const rawType = question.essay_type || question.question_type || "general";

    return {
      title:
        question.title ||
        question.question_title ||
        TASK2_DEFAULTS.DEFAULT_TITLE,
      prompt:
        question.prompt ||
        question.question_prompt ||
        question.question_text ||
        TASK2_DEFAULTS.DEFAULT_INSTRUCTIONS,
      code:
        question.question_code ||
        question.code ||
        (question.id ? `WT2-${question.id.slice(0, 6).toUpperCase()}` : "WT2-CBT"),
      questionType: rawType,
      questionTypeLabel:
        rawType
          .split("_")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
          .join(" "),
      difficulty: (question.difficulty || "medium").toLowerCase(),
      minWords: question.min_words || TASK2_DEFAULTS.MIN_WORD_COUNT,
      timeLimitMinutes:
        question.time_limit_minutes || TASK2_DEFAULTS.TIME_LIMIT_MINUTES,
      module: question.module || TASK2_DEFAULTS.MODULE,
    };
  }, [question]);

  // Integrate Writing Timer Engine
  const initialTimeSeconds = session?.task2_time_seconds || 0;
  const timeLimitSeconds = formattedMetadata
    ? formattedMetadata.timeLimitMinutes * 60
    : TASK2_DEFAULTS.TIME_LIMIT_SECONDS;

  const timerEngine = useTask2Timer({
    sessionId: loading ? null : sessionId,
    initialTimeSeconds,
    duration: timeLimitSeconds,
  });

  // Integrate Writing Analysis Engine (Word Count)
  const writingAnalysis = useMemo(() => {
    const minWords = formattedMetadata?.minWords || TASK2_DEFAULTS.MIN_WORD_COUNT;
    return WritingAnalysisService.analyzeWritingText(answer, minWords);
  }, [answer, formattedMetadata?.minWords]);

  // Integrate Autosave Engine
  const { autosaveState, forceSave, manualRetry } = useTask2Autosave({
    sessionId: loading ? null : sessionId,
    answer,
    wordCount: writingAnalysis.wordCount,
  });

  // Integrate Submission Validation Engine
  const { validationResult, canSubmit, blockingReason, validateNow } =
    useTask2SubmissionValidation({
      session,
      question,
      answer,
      writingAnalysis,
      autosaveState,
      isExpired: timerEngine.isExpired,
      remainingSeconds: timerEngine.remainingSeconds,
    });

  // Integrate Submission Engine
  const {
    status: submissionStatus,
    isSubmitting,
    isLocked,
    error: submissionError,
    submitTask2Session,
  } = useTask2Submission({
    sessionId: loading ? null : sessionId,
    answer,
    wordCount: writingAnalysis.wordCount,
    forceSave,
    validationResult,
  });

  // Integrate Session Finalization Engine
  const {
    finalizationStatus,
    isFinalized,
    finalizedSession,
    error: finalizationError,
    finalizeSession,
  } = useTask2Finalization({
    sessionId: loading ? null : sessionId,
    wordCount: writingAnalysis.wordCount,
    remainingSeconds: timerEngine.remainingSeconds,
    durationSeconds: timeLimitSeconds,
    submissionStatus,
    pauseTimer: timerEngine.pauseTimer,
  });

  // Integrate Submission Confirmation Engine
  const { showConfirmation, receiptData } = useTask2Confirmation({
    session,
    question,
    formattedMetadata,
    isFinalized,
    finalizedSession,
    writingAnalysis,
    remainingSeconds: timerEngine.remainingSeconds,
    durationSeconds: timeLimitSeconds,
  });

  // Integrate Evaluation Preparation Engine
  const { prepStatus, isPreparedForEval } = useTask2EvaluationPrep({
    sessionId: loading ? null : sessionId,
    isFinalized,
    finalizationStatus,
  });

  // Integrate Evaluation Orchestrator Engine
  const {
    evaluationStatus,
    isEvaluating,
    evaluationData,
    error: evaluationError,
    startEvaluation,
  } = useTask2Evaluation({
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
    submitTask2Session,
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

export default useTask2Session;

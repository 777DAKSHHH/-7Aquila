import { SessionService, SESSION_STATUS } from "./sessionService";
import { QuestionService } from "./questionService";
import { WritingAnalysisService } from "./writingAnalysisService";
import { PromptConstructionService } from "./promptConstructionService";
import { AIProviderEngineService } from "./aiProviderEngineService";
import { ResponseProcessingService } from "./responseProcessingService";
import { ScoringEngineService } from "./scoringEngineService";
import { FeedbackGenerationService } from "./feedbackGenerationService";
import { EvaluationPersistenceService } from "./evaluationPersistenceService";
import { EvaluationResultBuilderService } from "./evaluationResultBuilderService";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * EVALUATION ORCHESTRATOR SERVICE (Sprint 4 Complete - Phases 1 to 8)
 *
 * Single entry point & brain of the AI Assessment Platform.
 * Validates evaluation readiness, loads finalized session data, verifies ownership,
 * and orchestrates downstream pipeline engines (Prompt Builder -> AI Provider -> Response Parser -> Scoring Engine -> Feedback Engine -> Persistence -> Result Builder).
 * ==========================================================
 */

/**
 * Orchestrator Pipeline States
 */
export const ORCHESTRATOR_STATES = {
  IDLE: "idle",
  PREPARING: "preparing",
  CONSTRUCTING_PROMPT: "constructing_prompt",
  SENDING_PROVIDER_REQUEST: "sending_provider_request",
  PROCESSING_RESPONSE: "processing_response",
  CALCULATING_SCORE: "calculating_score",
  GENERATING_FEEDBACK: "generating_feedback",
  PERSISTING_EVALUATION: "persisting_evaluation",
  BUILDING_RESULTS: "building_results",
  RUNNING: "running",
  COMPLETED: "completed",
  FAILED: "failed",
  CANCELLED: "cancelled",
};

/**
 * Active in-flight evaluations map to prevent duplicate concurrent runs
 */
const activeEvaluations = new Map();

/**
 * Orchestrate the complete AI evaluation pipeline for a writing session.
 *
 * @param {Object} params
 * @param {string} params.sessionId - Target writing session UUID
 * @param {string} params.currentUserId - Authenticated student ID
 * @param {Function} params.onStatusChange - Pipeline state listener
 * @returns {Promise<Object>} Orchestration execution result
 */
export const orchestrateEvaluation = async ({
  sessionId,
  currentUserId,
  onStatusChange,
}) => {
  if (!sessionId) {
    onStatusChange?.(ORCHESTRATOR_STATES.FAILED);
    return {
      success: false,
      error: "Missing session ID for evaluation orchestration.",
      errorCode: "MISSING_SESSION_ID",
    };
  }

  // Idempotency & Concurrency Guard: reject concurrent runs for same session
  if (activeEvaluations.get(sessionId)) {
    console.warn(`[Rocket Evaluation Orchestrator] Duplicate run rejected for session: ${sessionId}`);
    return {
      success: false,
      error: "Evaluation is already running for this session.",
      errorCode: "DUPLICATE_RUN_REJECTED",
    };
  }

  activeEvaluations.set(sessionId, true);
  onStatusChange?.(ORCHESTRATOR_STATES.PREPARING);

  try {
    // 1. Fetch Writing Session Record (Server Source of Truth)
    const sessionRes = await SessionService.getWritingSession(sessionId);

    if (!sessionRes || !sessionRes.success || !sessionRes.data) {
      throw new Error(sessionRes?.error || "Writing session record not found.");
    }

    const sessionData = sessionRes.data;

    // 2. Verify Student Ownership
    const fallbackUserId = "00000000-0000-0000-0000-000000000000";
    if (
      sessionData.student_id &&
      currentUserId &&
      sessionData.student_id !== currentUserId &&
      sessionData.student_id !== fallbackUserId
    ) {
      throw new Error("Unauthorized access. You do not own this test session.");
    }

    // 3. Verify Evaluation Readiness
    const isReady =
      sessionData.status === SESSION_STATUS.EVALUATING ||
      sessionData.status === SESSION_STATUS.COMPLETED ||
      sessionData.is_draft === false;

    if (!isReady) {
      throw new Error("Session is not finalized or ready for evaluation.");
    }

    // 4. Fetch Attached Task 1 Question
    if (!sessionData.task1_question_id) {
      throw new Error("Missing associated Task 1 question ID.");
    }

    const questionRes = await QuestionService.getQuestionById(
      "writing_task1",
      sessionData.task1_question_id
    );

    if (!questionRes || !questionRes.success || !questionRes.data) {
      throw new Error(
        questionRes?.error || "Associated question record could not be loaded."
      );
    }

    const questionData = questionRes.data;

    // 5. Load Essay Response & Perform Writing Analysis
    const answerText = (
      sessionData.task1_answer ||
      sessionData.task1_content ||
      ""
    ).trim();

    if (!answerText) {
      throw new Error("Essay response text is empty.");
    }

    const minWords = questionData.min_words || 150;
    const writingAnalysis = WritingAnalysisService.analyzeWritingText(
      answerText,
      minWords
    );

    // 6. Assemble Prepared Evaluation Context Bundle
    onStatusChange?.(ORCHESTRATOR_STATES.CONSTRUCTING_PROMPT);

    const evaluationContext = {
      sessionId,
      studentId: sessionData.student_id,
      questionId: sessionData.task1_question_id,
      module: "writing_task1",
      question: {
        id: questionData.id,
        code: questionData.question_code || "WT1-CBT",
        title: questionData.title || questionData.question_title || "Writing Task 1",
        prompt: questionData.prompt || questionData.question_prompt || "",
        type: questionData.question_type || "general",
        minWords,
      },
      essay: {
        text: answerText,
        wordCount: writingAnalysis.wordCount,
        characterCount: writingAnalysis.characterCount,
        paragraphCount: writingAnalysis.paragraphCount,
        sentenceCount: writingAnalysis.sentenceCount,
      },
      timestamps: {
        submittedAt: sessionData.submitted_at || sessionData.completed_at,
        completedAt: sessionData.completed_at,
        timeTakenSeconds: sessionData.task1_time_seconds || 0,
      },
      config: {
        targetModel: "gpt-4o",
        version: "v1.0.0",
        rubric: "IELTS_ACADEMIC_WRITING_TASK1",
      },
    };

    // 7. Execute Phase 2 Prompt Construction Engine
    const packageRes = PromptConstructionService.constructEvaluationPackage(evaluationContext);

    if (!packageRes.success || !packageRes.data) {
      throw new Error(packageRes.error || "Failed to construct evaluation package.");
    }

    const evaluationPackage = packageRes.data;

    // 8. Execute Phase 3 AI Provider Engine
    onStatusChange?.(ORCHESTRATOR_STATES.SENDING_PROVIDER_REQUEST);

    const providerRes = await AIProviderEngineService.executeProviderRequest({
      evaluationPackage,
    });

    if (!providerRes.success || !providerRes.data) {
      throw new Error(providerRes.error || "AI Provider Engine execution failed.");
    }

    const rawProviderResponse = providerRes.data;

    // 9. Execute Phase 4 Response Processing Engine
    onStatusChange?.(ORCHESTRATOR_STATES.PROCESSING_RESPONSE);

    const processRes = ResponseProcessingService.processProviderResponse(rawProviderResponse);

    if (!processRes.success || !processRes.data) {
      throw new Error(processRes.error || "Response Processing Engine failed to parse evaluation.");
    }

    const normalizedEvaluation = processRes.data;

    // 10. Execute Phase 5 Scoring Engine
    onStatusChange?.(ORCHESTRATOR_STATES.CALCULATING_SCORE);

    const scoreRes = ScoringEngineService.calculateOfficialScore(normalizedEvaluation);

    if (!scoreRes.success || !scoreRes.data) {
      throw new Error(scoreRes.error || "Scoring Engine failed to calculate official IELTS score.");
    }

    const officialScore = scoreRes.data;

    // 11. Execute Phase 6 Feedback Generation Engine
    onStatusChange?.(ORCHESTRATOR_STATES.GENERATING_FEEDBACK);

    const feedbackRes = FeedbackGenerationService.generateStructuredFeedback({
      normalizedEvaluation,
      officialScore,
    });

    if (!feedbackRes.success || !feedbackRes.data) {
      throw new Error(feedbackRes.error || "Feedback Generation Engine failed to assemble feedback.");
    }

    const structuredFeedback = feedbackRes.data;

    // 12. Execute Phase 7 Evaluation Persistence Engine
    onStatusChange?.(ORCHESTRATOR_STATES.PERSISTING_EVALUATION);

    const persistRes = await EvaluationPersistenceService.persistEvaluationResults({
      sessionId,
      evaluationContext,
      evaluationPackage,
      rawProviderResponse,
      normalizedEvaluation,
      officialScore,
      structuredFeedback,
    });

    if (!persistRes.success || !persistRes.data) {
      throw new Error(persistRes.error || "Evaluation Persistence Engine failed to save results.");
    }

    const persistedRecord = persistRes.data;

    // 13. Execute Phase 8 Evaluation Result Builder Engine
    onStatusChange?.(ORCHESTRATOR_STATES.BUILDING_RESULTS);

    const resultRes = EvaluationResultBuilderService.buildEvaluationResults({
      evaluationContext,
      evaluationPackage,
      rawProviderResponse,
      normalizedEvaluation,
      officialScore,
      structuredFeedback,
      persistedRecord,
    });

    if (!resultRes.success || !resultRes.data) {
      throw new Error(resultRes.error || "Evaluation Result Builder failed to construct view models.");
    }

    const evaluationResults = resultRes.data;

    onStatusChange?.(ORCHESTRATOR_STATES.COMPLETED);

    return {
      success: true,
      data: {
        sessionId,
        status: ORCHESTRATOR_STATES.COMPLETED,
        evaluationContext,
        evaluationPackage,
        rawProviderResponse,
        normalizedEvaluation,
        officialScore,
        structuredFeedback,
        persistedRecord,
        evaluationResults,
        orchestratedAt: new Date().toISOString(),
      },
    };
  } catch (err) {
    console.error("[Rocket Evaluation Orchestrator Error]", err);
    onStatusChange?.(ORCHESTRATOR_STATES.FAILED);

    return {
      success: false,
      error:
        err.message ||
        "An unexpected error occurred during evaluation orchestration.",
      errorCode: "ORCHESTRATION_FAILED",
    };
  } finally {
    activeEvaluations.delete(sessionId);
  }
};

/**
 * Exported Evaluation Orchestrator Gateway
 */
export const EvaluationOrchestratorService = {
  ORCHESTRATOR_STATES,
  orchestrateEvaluation,
};

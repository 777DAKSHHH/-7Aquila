import { SessionService } from "./sessionService";
import { QuestionService } from "./questionService";
import { StorageService } from "./storageService";
import { WritingAnalysisService } from "./writingAnalysisService";
import { TASK1_DEFAULTS, QUESTION_TYPE_LABELS } from "../../pages/assessment/writing/task1/constants/task1Constants";

/**
 * UUID Validation helper
 */
const isValidUUID = (uuid) => {
  if (typeof uuid !== "string") return false;
  const regex =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
  return regex.test(uuid);
};

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * SESSION RECOVERY SERVICE (Recovery Orchestrator)
 *
 * Single point of orchestration for restoring complete CBT sessions.
 * Coordinates: Session -> Ownership -> Question -> Asset -> Text -> Timer -> Analysis
 * Prevents race conditions and guarantees deterministic startup.
 * ==========================================================
 */
export const orchestrateSessionRecovery = async ({
  sessionId,
  currentUserId,
}) => {
  // 1. Validate Session UUID
  if (!sessionId) {
    return {
      success: false,
      error: "No session ID provided in URL. Please launch a session from Task Selection.",
      errorCode: "MISSING_UUID",
    };
  }

  if (!isValidUUID(sessionId)) {
    return {
      success: false,
      error: "Invalid session ID format. Please launch a valid CBT writing session.",
      errorCode: "INVALID_UUID",
    };
  }

  try {
    // 2. Fetch Writing Session Record (Server Source of Truth)
    const sessionRes = await SessionService.getWritingSession(sessionId);

    if (!sessionRes.success || !sessionRes.data) {
      return {
        success: false,
        error: sessionRes.error || "Writing session not found or has been deleted.",
        errorCode: "SESSION_NOT_FOUND",
      };
    }

    const sessionData = sessionRes.data;

    // 3. Verify Student Ownership
    const fallbackUserId = "00000000-0000-0000-0000-000000000000";
    if (
      sessionData.student_id &&
      currentUserId &&
      sessionData.student_id !== currentUserId &&
      sessionData.student_id !== fallbackUserId
    ) {
      return {
        success: false,
        error: "Unauthorized access. You do not have permission to view this test session.",
        errorCode: "UNAUTHORIZED",
      };
    }

    // 4. Fetch Attached Task 1 Question Record
    if (!sessionData.task1_question_id) {
      return {
        success: false,
        error: "No Task 1 question is attached to this writing session.",
        errorCode: "MISSING_QUESTION_ID",
      };
    }

    const questionRes = await QuestionService.getQuestionById(
      "writing_task1",
      sessionData.task1_question_id
    );

    if (!questionRes.success || !questionRes.data) {
      return {
        success: false,
        error: questionRes.error || "Associated Task 1 question could not be loaded from database.",
        errorCode: "QUESTION_NOT_FOUND",
      };
    }

    const questionData = questionRes.data;

    // Validate Question Data Completeness
    const hasTitle = Boolean(
      questionData.title || questionData.question_title || questionData.name
    );
    const hasPrompt = Boolean(
      questionData.prompt || questionData.question_prompt || questionData.description
    );
    const isIncomplete = !hasTitle && !hasPrompt;

    // 5. Resolve Asset Image Public URL
    const rawImagePath =
      questionData.image_path ||
      questionData.chart_image_url ||
      questionData.image_url;

    let imageUrl = null;
    if (rawImagePath) {
      imageUrl =
        StorageService.getWritingTask1Image(rawImagePath) ||
        QuestionService.getQuestionImage(rawImagePath);
    }

    // 6. Restore Answer Content
    const restoredAnswer =
      sessionData.task1_answer ||
      sessionData.task1_content ||
      sessionData.draft_content ||
      "";

    // 7. Format Metadata
    const rawType = questionData.question_type || questionData.type || "general";
    const typeLabel =
      QUESTION_TYPE_LABELS[rawType] ||
      rawType
        .split("_")
        .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
        .join(" ");

    const formattedMetadata = {
      title:
        questionData.title ||
        questionData.question_title ||
        TASK1_DEFAULTS.DEFAULT_TITLE,
      prompt:
        questionData.prompt ||
        questionData.question_prompt ||
        questionData.description ||
        TASK1_DEFAULTS.DEFAULT_INSTRUCTIONS,
      code:
        questionData.question_code ||
        questionData.code ||
        (questionData.id ? `WT1-${questionData.id.slice(0, 6).toUpperCase()}` : "WT1-CBT"),
      questionType: rawType,
      questionTypeLabel: typeLabel,
      difficulty: (questionData.difficulty || "medium").toLowerCase(),
      minWords: questionData.min_words || TASK1_DEFAULTS.MIN_WORD_COUNT,
      timeLimitMinutes:
        questionData.time_limit_minutes || TASK1_DEFAULTS.TIME_LIMIT_MINUTES,
      module: questionData.module || TASK1_DEFAULTS.MODULE,
    };

    // 8. Restore Timer Parameters
    const initialTimeSeconds = sessionData.task1_time_seconds || 0;
    const timeLimitSeconds = formattedMetadata.timeLimitMinutes * 60;
    const remainingSeconds = Math.max(0, timeLimitSeconds - initialTimeSeconds);
    const isExpired = remainingSeconds <= 0;

    // 9. Restore Writing Analysis Metrics
    const writingAnalysis = WritingAnalysisService.analyzeWritingText(
      restoredAnswer,
      formattedMetadata.minWords
    );

    return {
      success: true,
      data: {
        session: sessionData,
        question: questionData,
        formattedMetadata,
        imageUrl,
        restoredAnswer,
        initialTimeSeconds,
        timeLimitSeconds,
        remainingSeconds,
        isExpired,
        writingAnalysis,
        isIncomplete,
        recoveredAt: new Date(),
      },
    };
  } catch (err) {
    console.error("[Rocket Session Recovery Orchestrator Error]", err);
    return {
      success: false,
      error: err.message || "An unexpected error occurred during session recovery.",
      errorCode: "RECOVERY_FAILED",
    };
  }
};

export const SessionRecoveryService = {
  orchestrateSessionRecovery,
};

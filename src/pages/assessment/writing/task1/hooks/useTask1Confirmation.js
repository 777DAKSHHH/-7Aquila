import { useMemo } from "react";

/**
 * Custom hook for Task 1 Submission Confirmation Engine (Sprint 3 - Phase 4).
 *
 * Responsibilities:
 * - Formats official examination receipt data from finalized session metadata.
 * - Enforces Back-button & Page Reload protection: automatically presents read-only confirmation screen if session is finalized/completed.
 * - Calculates time taken formatting (MM:SS).
 * - Exposes showConfirmation boolean and structured receiptData object.
 */
export const useTask1Confirmation = ({
  session,
  question,
  formattedMetadata,
  isFinalized,
  finalizedSession,
  writingAnalysis,
  remainingSeconds,
  durationSeconds = 1200,
}) => {
  // Determine if session is completed (from active session finalization OR reloaded completed session)
  const isCompletedSession = useMemo(() => {
    if (isFinalized) return true;
    if (!session) return false;
    return (
      session.status === "completed" ||
      session.status === "submitted" ||
      session.is_draft === false
    );
  }, [isFinalized, session]);

  // Format receipt payload
  const receiptData = useMemo(() => {
    if (!isCompletedSession) return null;

    const activeSession = finalizedSession || session || {};

    const wordCount =
      activeSession.task1_word_count ??
      writingAnalysis?.wordCount ??
      0;

    const timeTakenSec =
      activeSession.task1_time_seconds ??
      Math.max(0, durationSeconds - remainingSeconds);

    const mins = Math.floor(timeTakenSec / 60);
    const secs = timeTakenSec % 60;
    const timeTakenFormatted = `${String(mins).padStart(2, "0")}:${String(
      secs
    ).padStart(2, "0")}`;

    const submittedAt =
      activeSession.completed_at ||
      activeSession.submitted_at ||
      activeSession.last_saved_at ||
      new Date().toISOString();

    return {
      sessionId: activeSession.id || session?.id || "",
      questionCode:
        formattedMetadata?.code ||
        question?.question_code ||
        "WT1-CBT",
      questionTitle:
        formattedMetadata?.title ||
        question?.title ||
        "Writing Task 1 Examination",
      submittedAt,
      finalWordCount: wordCount,
      timeTakenSeconds: timeTakenSec,
      timeTakenFormatted,
      status: activeSession.status || "completed",
    };
  }, [
    isCompletedSession,
    finalizedSession,
    session,
    writingAnalysis,
    durationSeconds,
    remainingSeconds,
    formattedMetadata,
    question,
  ]);

  return {
    showConfirmation: isCompletedSession,
    receiptData,
  };
};

export default useTask1Confirmation;

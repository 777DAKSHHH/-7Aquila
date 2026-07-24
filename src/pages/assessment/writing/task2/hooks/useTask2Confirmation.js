import { useMemo } from "react";

/**
 * Custom hook for Task 2 Submission Confirmation Engine.
 */
export const useTask2Confirmation = ({
  session,
  question,
  formattedMetadata,
  isFinalized,
  finalizedSession,
  writingAnalysis,
  remainingSeconds,
  durationSeconds = 2400,
}) => {
  // Determine if session is completed
  const isCompletedSession = useMemo(() => {
    if (isFinalized) return true;
    if (!session) return false;
    return (
      session.status === "completed" ||
      session.status === "evaluated" ||
      session.status === "submitted" ||
      session.is_draft === false
    );
  }, [isFinalized, session]);

  // Format receipt payload
  const receiptData = useMemo(() => {
    if (!isCompletedSession) return null;

    const activeSession = finalizedSession || session || {};

    const wordCount =
      activeSession.task2_word_count ??
      writingAnalysis?.wordCount ??
      0;

    const timeTakenSec =
      activeSession.task2_time_seconds ??
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
        "WT2-CBT",
      questionTitle:
        formattedMetadata?.title ||
        question?.title ||
        "Writing Task 2 Examination",
      submittedAt,
      finalWordCount: wordCount,
      timeTakenSeconds: timeTakenSec,
      timeTakenFormatted,
      status: activeSession.status || "evaluated",
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

export default useTask2Confirmation;

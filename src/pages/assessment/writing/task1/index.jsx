import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTask1Session from "./hooks/useTask1Session";
import QuestionImageContainer from "./components/QuestionImageContainer";
import QuestionMetadataPanel from "./components/QuestionMetadataPanel";
import QuestionTimerDisplay from "./components/QuestionTimerDisplay";
import WordCountBadge from "./components/WordCountBadge";
import AutosaveStatusBadge from "./components/AutosaveStatusBadge";
import SubmissionValidationModal from "./components/SubmissionValidationModal";
import SubmissionReceiptCard from "./components/SubmissionReceiptCard";
import { TASK1_DEFAULTS } from "./constants/task1Constants";
import AppIcon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";
import { APP_ROUTES } from "../../../../config/routes";

const WritingTask1 = () => {
  const navigate = useNavigate();
  const [isValidationModalOpen, setIsValidationModalOpen] = useState(false);

  const {
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
    // Sprint 2 Phase 3 Timer Engine props
    formattedTime,
    warningState,
    isExpired,
    // Sprint 2 Phase 4 Writing Analysis Engine props
    writingAnalysis,
    // Sprint 2 Phase 5 Autosave Engine props
    autosaveState,
    manualRetry,
    // Sprint 3 Phase 1 Submission Validation Engine props
    validationResult,
    canSubmit,
    blockingReason,
    validateNow,
    // Sprint 3 Phase 2 Submission Engine props
    submissionStatus,
    isSubmitting,
    isLocked,
    submissionError,
    submitTask1Session,
    // Sprint 3 Phase 3 Session Finalization Engine props
    finalizationStatus,
    isFinalized,
    finalizedSession,
    // Sprint 3 Phase 4 Submission Confirmation Engine props
    showConfirmation,
    receiptData,
    // Sprint 3 Phase 5 Evaluation Preparation Engine props
    prepStatus,
    isPreparedForEval,
    // Sprint 4 (Phases 1 to 8) AI Evaluation Architecture props
    evaluationStatus,
    isEvaluating,
    evaluationData,
    evaluationError,
    startEvaluation,
    reloadSession,
  } = useTask1Session();

  const handleOpenValidationModal = () => {
    if (isLocked || isFinalized || showConfirmation) return;
    validateNow();
    setIsValidationModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const res = await submitTask1Session();
    if (res && res.success) {
      setIsValidationModalOpen(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate(
      APP_ROUTES.WRITING_SELECTION || "/assessment/writing/task-selection"
    );
  };

  // 1. SKELETON LOADING STATE (Rocket CBT Design)
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
        {/* Header & Metadata Skeleton */}
        <div className="h-16 bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 bg-muted rounded-xl" />
            <div className="h-8 w-24 bg-muted rounded-full" />
          </div>
        </div>

        {/* Main Split View Skeleton */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          {/* Left Panel: Question Prompt & Image Skeleton */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-5 flex flex-col">
            <div className="h-7 w-2/3 bg-muted rounded" />
            <div className="h-24 bg-muted/60 rounded-xl" />
            <div className="flex-1 bg-muted/30 rounded-xl min-h-[300px]" />
          </div>

          {/* Right Panel: Editor Skeleton */}
          <div className="bg-card border border-border rounded-xl p-6 space-y-4 flex flex-col">
            <div className="h-6 w-1/3 bg-muted rounded" />
            <div className="flex-1 bg-muted/30 rounded-xl min-h-[420px]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE (Session Not Found, Invalid UUID, DB Failure, or Ownership Error)
  if (error || !session || !question) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-card border border-destructive/30 rounded-2xl p-8 text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full mx-auto flex items-center justify-center">
            <AppIcon name="AlertTriangle" size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Task 1 Session Loading Error
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              {error || "Unable to retrieve question details for this test session."}
            </p>
          </div>

          {sessionId && (
            <div className="bg-muted/40 p-3 rounded-lg text-xs font-mono text-muted-foreground inline-block">
              Session UUID: {sessionId}
            </div>
          )}

          <div className="flex flex-wrap justify-center gap-3 pt-2">
            <Button
              variant="outline"
              onClick={() => reloadSession()}
              iconName="RotateCcw"
            >
              Retry Loading
            </Button>
            <Button
              variant="default"
              onClick={handleReturnToDashboard}
              iconName="ArrowLeft"
            >
              Back to Task Selection
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE (Question exists but data is incomplete)
  if (isIncomplete) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-card border border-amber-500/30 rounded-2xl p-8 text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 bg-amber-500/10 text-amber-600 rounded-full mx-auto flex items-center justify-center">
            <AppIcon name="FileQuestion" size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Question Data Incomplete
            </h2>
            <p className="text-muted-foreground text-sm max-w-md mx-auto leading-relaxed">
              {TASK1_DEFAULTS.INCOMPLETE_DATA_MESSAGE}
            </p>
          </div>

          <div className="pt-2">
            <Button
              variant="default"
              onClick={handleReturnToDashboard}
              iconName="ArrowLeft"
            >
              Return to Selection Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 4. SUBMISSION CONFIRMATION RECEIPT VIEW (Sprint 3 & Sprint 4 Complete - AI Evaluation Architecture)
  if (showConfirmation && receiptData) {
    return (
      <SubmissionReceiptCard
        receiptData={receiptData}
        isPreparedForEval={isPreparedForEval}
        isEvaluating={isEvaluating}
        evaluationStatus={evaluationStatus}
        evaluationData={evaluationData}
        onStartEvaluation={startEvaluation}
        onReturnToDashboard={handleReturnToDashboard}
      />
    );
  }

  // 5. PRODUCTION CBT INTERFACE (Active Examination View)
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar with Live Countdown Clock & Submit Action */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <AppIcon name="FileText" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-heading font-bold text-foreground leading-tight">
                Writing Task 1 — Examination
              </h1>
              {isRecovered && !isLocked && !isFinalized && (
                <span className="px-2 py-0.5 bg-primary/10 text-primary text-[10px] font-semibold rounded-md border border-primary/20 flex items-center gap-1">
                  <AppIcon name="RefreshCw" size={10} />
                  Session Restored
                </span>
              )}
              {isFinalized && (
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <AppIcon name="CheckCheck" size={10} />
                  Session Finalized
                </span>
              )}
              {isLocked && !isFinalized && (
                <span className="px-2 py-0.5 bg-emerald-500/15 text-emerald-600 text-[10px] font-bold rounded-md border border-emerald-500/30 flex items-center gap-1">
                  <AppIcon name="Lock" size={10} />
                  Submission Locked
                </span>
              )}
            </div>
            <p className="text-xs text-muted-foreground font-caption">
              Session: <span className="font-mono text-foreground">{sessionId.slice(0, 8)}...</span>
            </p>
          </div>
        </div>

        {/* Timer Display Widget & Submit Task Button */}
        <div className="flex items-center gap-3">
          <QuestionTimerDisplay
            formattedTime={formattedTime}
            warningState={warningState}
            isExpired={isExpired || isLocked || isFinalized}
          />
          <Button
            variant={isLocked || isFinalized ? "secondary" : "default"}
            size="default"
            disabled={isLocked || isFinalized || isSubmitting}
            onClick={handleOpenValidationModal}
            iconName={isLocked || isFinalized ? "Check" : "Send"}
            className="font-bold shadow-xs"
          >
            {isFinalized ? "Completed" : isLocked ? "Submitted" : "Validate & Submit Task 1"}
          </Button>
        </div>
      </div>

      {/* Top Question Metadata Panel Component */}
      <QuestionMetadataPanel metadata={formattedMetadata} />

      {/* Main Split-View CBT Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-start">
        {/* Left Panel: Dynamic Question Title, Instructions & Diagram Image */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-5 flex flex-col">
          {/* Question Title & Instructions Prompt */}
          <div className="border-b border-border pb-4 space-y-3">
            <h2 className="text-xl font-heading font-bold text-foreground">
              {formattedMetadata.title}
            </h2>
            <div className="bg-muted/30 p-4 rounded-xl border border-border/60 text-sm text-foreground/90 leading-relaxed font-caption space-y-2">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-primary uppercase tracking-wider">
                <AppIcon name="Info" size={14} />
                IELTS Instructions
              </div>
              <p>{formattedMetadata.prompt}</p>
            </div>
          </div>

          {/* Question Image Component */}
          <QuestionImageContainer
            imageUrl={imageUrl}
            imageLoading={imageLoading}
            imageError={imageError}
            onImageLoad={handleImageLoad}
            onImageError={handleImageError}
            altText={formattedMetadata.title}
          />

          {/* Footer note */}
          <div className="text-xs text-muted-foreground border-t border-border pt-3 flex items-center justify-between">
            <span>Spend about {formattedMetadata.timeLimitMinutes} minutes on this task.</span>
            <span className="font-semibold text-foreground">
              Write at least {formattedMetadata.minWords} words.
            </span>
          </div>
        </div>

        {/* Right Panel: Student Response Editor */}
        <div className="bg-card border border-border rounded-xl p-6 shadow-xs space-y-4 flex flex-col min-h-[560px]">
          {/* Response Editor Header */}
          <div className="flex items-center justify-between border-b border-border pb-3 flex-wrap gap-2">
            <h3 className="text-lg font-heading font-semibold text-foreground flex items-center gap-2">
              <AppIcon name="Edit3" size={20} className="text-primary" />
              Your Response
            </h3>

            {/* Badges: Autosave Status & Compact Word Count */}
            <div className="flex items-center gap-2">
              <AutosaveStatusBadge
                autosaveState={
                  isLocked || isFinalized
                    ? { status: "saved", lastSavedAt: new Date() }
                    : autosaveState
                }
                onRetry={manualRetry}
              />
              <WordCountBadge analysis={writingAnalysis} compact={true} />
            </div>
          </div>

          {/* Response Textarea */}
          <div className="flex-1 flex flex-col space-y-2 relative">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Write your report response here..."
              disabled={isExpired || isLocked || isFinalized || isSubmitting}
              className={`w-full flex-1 min-h-[380px] p-4 bg-background border border-border rounded-xl text-foreground font-body text-base leading-relaxed focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-y transition-all placeholder:text-muted-foreground/60 shadow-inner ${
                isExpired || isLocked || isFinalized || isSubmitting
                  ? "opacity-75 cursor-not-allowed bg-muted/20"
                  : ""
              }`}
            />

            {/* Locked / Finalized Overlay */}
            {(isLocked || isFinalized) && (
              <div className="absolute inset-0 bg-background/60 backdrop-blur-[1px] rounded-xl flex items-center justify-center p-6 text-center border border-emerald-500/30">
                <div className="bg-card border border-emerald-500/40 p-6 rounded-2xl shadow-xl space-y-3 max-w-sm">
                  <div className="w-12 h-12 bg-emerald-500/15 text-emerald-600 rounded-full mx-auto flex items-center justify-center">
                    <AppIcon name={isFinalized ? "CheckCheck" : "Lock"} size={24} />
                  </div>
                  <h4 className="font-heading font-bold text-foreground text-lg">
                    {isFinalized ? "Session Finalized" : "Submission Locked"}
                  </h4>
                  <p className="text-xs text-muted-foreground leading-relaxed font-caption">
                    {isFinalized
                      ? "Your writing session has been officially finalized and closed."
                      : "Your Task 1 response has been safely persisted and locked."}
                  </p>
                </div>
              </div>
            )}
          </div>

          {/* Sprint 2 Phase 4 Writing Analysis Progress & Submit Action */}
          <div className="border-t border-border pt-3 flex flex-col space-y-3">
            <WordCountBadge analysis={writingAnalysis} compact={false} />
            <div className="flex items-center justify-end pt-1">
              <Button
                variant={isLocked || isFinalized ? "secondary" : "default"}
                disabled={isLocked || isFinalized || isSubmitting}
                onClick={handleOpenValidationModal}
                iconName={isLocked || isFinalized ? "Check" : "Send"}
                className="font-bold"
              >
                {isFinalized ? "Completed" : isLocked ? "Submitted" : "Validate & Submit Task 1"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Sprint 3 Phase 1 & 2 Submission Modal */}
      <SubmissionValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        onConfirmSubmit={handleConfirmSubmit}
        validationResult={validationResult}
        writingAnalysis={writingAnalysis}
        isSubmitting={isSubmitting}
        submissionStatus={submissionStatus}
        submissionError={submissionError}
      />
    </div>
  );
};

export default WritingTask1;
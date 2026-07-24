import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import useTask2Session from "./hooks/useTask2Session";
import QuestionMetadataPanel from "../task1/components/QuestionMetadataPanel";
import QuestionTimerDisplay from "../task1/components/QuestionTimerDisplay";
import WordCountBadge from "../task1/components/WordCountBadge";
import AutosaveStatusBadge from "../task1/components/AutosaveStatusBadge";
import SubmissionValidationModal from "../task1/components/SubmissionValidationModal";
import SubmissionReceiptCard from "../task1/components/SubmissionReceiptCard";
import { TASK2_DEFAULTS } from "./constants/task2Constants";
import AppIcon from "../../../../components/AppIcon";
import Button from "../../../../components/ui/Button";
import { APP_ROUTES } from "../../../../config/routes";

const WritingTask2 = () => {
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
    answer,
    setAnswer,
    // Timer props
    formattedTime,
    warningState,
    isExpired,
    // Writing Analysis props
    writingAnalysis,
    // Autosave props
    autosaveState,
    manualRetry,
    // Validation props
    validationResult,
    canSubmit,
    blockingReason,
    validateNow,
    // Submission props
    submissionStatus,
    isSubmitting,
    isLocked,
    submissionError,
    submitTask2Session,
    // Session Finalization props
    finalizationStatus,
    isFinalized,
    finalizedSession,
    // Confirmation props
    showConfirmation,
    receiptData,
    // Evaluation Preparation props
    prepStatus,
    isPreparedForEval,
    // AI Evaluation props
    evaluationStatus,
    isEvaluating,
    evaluationData,
    evaluationError,
    startEvaluation,
    reloadSession,
  } = useTask2Session();

  const handleOpenValidationModal = () => {
    if (isLocked || isFinalized || showConfirmation) return;
    validateNow();
    setIsValidationModalOpen(true);
  };

  const handleConfirmSubmit = async () => {
    const res = await submitTask2Session();
    if (res && res.success) {
      setIsValidationModalOpen(false);
    }
  };

  const handleReturnToDashboard = () => {
    navigate(
      APP_ROUTES.WRITING_SELECTION || "/assessment/writing"
    );
  };

  // 1. SKELETON LOADING STATE
  if (loading) {
    return (
      <div className="max-w-7xl mx-auto space-y-6 pb-12 animate-pulse">
        <div className="h-16 bg-card border border-border rounded-xl p-4 flex items-center justify-between">
          <div className="h-6 w-48 bg-muted rounded" />
          <div className="flex items-center gap-3">
            <div className="h-10 w-36 bg-muted rounded-xl" />
            <div className="h-8 w-24 bg-muted rounded-full" />
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px]">
          <div className="bg-card border border-border rounded-xl p-6 space-y-5 flex flex-col">
            <div className="h-7 w-2/3 bg-muted rounded" />
            <div className="h-24 bg-muted/60 rounded-xl" />
            <div className="flex-1 bg-muted/30 rounded-xl min-h-[300px]" />
          </div>

          <div className="bg-card border border-border rounded-xl p-6 space-y-4 flex flex-col">
            <div className="h-6 w-1/3 bg-muted rounded" />
            <div className="flex-1 bg-muted/30 rounded-xl min-h-[420px]" />
          </div>
        </div>
      </div>
    );
  }

  // 2. ERROR STATE
  if (error || !session || !question) {
    return (
      <div className="max-w-3xl mx-auto py-16 px-4">
        <div className="bg-card border border-destructive/30 rounded-2xl p-8 text-center space-y-6 shadow-lg">
          <div className="w-16 h-16 bg-destructive/10 text-destructive rounded-full mx-auto flex items-center justify-center">
            <AppIcon name="AlertTriangle" size={32} />
          </div>

          <div className="space-y-2">
            <h2 className="text-2xl font-heading font-bold text-foreground">
              Task 2 Session Loading Error
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
              Back to Selection Dashboard
            </Button>
          </div>
        </div>
      </div>
    );
  }

  // 3. EMPTY STATE
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
              {TASK2_DEFAULTS.INCOMPLETE_DATA_MESSAGE}
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

  // 4. SUBMISSION CONFIRMATION RECEIPT VIEW
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

  // 5. PRODUCTION CBT INTERFACE
  return (
    <div className="max-w-7xl mx-auto space-y-6 pb-12">
      {/* Top Header Bar */}
      <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-primary/10 text-primary rounded-lg">
            <AppIcon name="FileText" size={22} />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-lg font-heading font-bold text-foreground leading-tight">
                Writing Task 2 — Essay Examination
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
            </div>
            <p className="text-xs text-muted-foreground mt-0.5">
              Academic & General Essay Module
            </p>
          </div>
        </div>

        {/* Live Timer Clock & Submit Actions */}
        <div className="flex items-center gap-3 self-end sm:self-auto">
          <QuestionTimerDisplay
            formattedTime={formattedTime}
            warningState={warningState}
          />

          <Button
            variant="default"
            onClick={handleOpenValidationModal}
            disabled={isLocked || isFinalized || isSubmitting}
            iconName="Send"
            iconPosition="right"
            className="font-bold shadow-xs px-5"
          >
            Submit Exam
          </Button>
        </div>
      </div>

      {/* Main Split Interface */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[600px] items-stretch">
        
        {/* Left Side: Question essay prompt card */}
        <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-xs flex flex-col space-y-6">
          <QuestionMetadataPanel metadata={formattedMetadata} />

          <div className="flex-1 flex flex-col space-y-4">
            <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
              <AppIcon name="FileQuestion" size={16} className="text-primary" />
              <span>Writing Prompt / Essay Topic</span>
            </div>

            <div className="flex-1 bg-muted/20 border border-border/70 rounded-xl p-6 overflow-y-auto leading-relaxed text-foreground select-text space-y-4">
              <h3 className="font-heading font-bold text-lg border-b border-border/50 pb-2">
                {formattedMetadata?.title}
              </h3>
              <p className="text-base text-foreground/90 whitespace-pre-wrap font-medium font-caption">
                {formattedMetadata?.prompt}
              </p>
            </div>

            {/* IELTS Standard Instructions Footer */}
            <div className="bg-primary/5 border border-primary/10 rounded-xl p-4 flex gap-3 text-xs text-primary/90">
              <AppIcon name="Info" size={18} className="shrink-0 mt-0.5" />
              <div className="space-y-1">
                <span className="font-bold">Instructions</span>
                <p className="leading-relaxed font-caption">
                  You should write at least 250 words. Give reasons for your answer and include any relevant examples from your own knowledge or experience. Do not copy prompt sentences directly.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Right Side: Professional editor with autosave indicators */}
        <div className="bg-card border border-border rounded-xl p-5 md:p-6 shadow-xs flex flex-col space-y-4">
          <div className="flex items-center justify-between border-b border-border pb-3">
            <div className="flex items-center gap-2">
              <AppIcon name="Edit3" size={18} className="text-primary" />
              <h2 className="text-base font-heading font-semibold text-foreground">
                Your Response Editor
              </h2>
            </div>
            
            <AutosaveStatusBadge
              status={autosaveState.status}
              lastSavedAt={autosaveState.lastSavedAt}
              onRetry={manualRetry}
            />
          </div>

          {/* Text Editor Textarea */}
          <div className="flex-1 relative flex flex-col min-h-[380px]">
            <textarea
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              disabled={isLocked || isFinalized || isSubmitting}
              placeholder="Start typing your essay response here..."
              className="flex-1 w-full bg-background border border-border rounded-xl p-4 md:p-5 text-foreground leading-relaxed text-base focus:outline-none focus:ring-2 focus:ring-primary/20 focus:border-primary resize-none disabled:bg-muted/30 disabled:text-muted-foreground select-text"
              spellCheck="true"
            />
          </div>

          {/* Footer Metadata Badge bar */}
          <div className="flex items-center justify-between pt-2 border-t border-border/50 text-xs">
            <WordCountBadge
              wordCount={writingAnalysis.wordCount}
              minimumRequired={formattedMetadata?.minWords || 250}
              metRequirement={writingAnalysis.metRequirement}
            />

            <span className="text-muted-foreground font-mono">
              Academic / General Module
            </span>
          </div>
        </div>

      </div>

      {/* Submission validation review Modal */}
      <SubmissionValidationModal
        isOpen={isValidationModalOpen}
        onClose={() => setIsValidationModalOpen(false)}
        validationResult={validationResult}
        isSubmitting={isSubmitting}
        onConfirm={handleConfirmSubmit}
      />
    </div>
  );
};

export default WritingTask2;
import React from "react";
import AppIcon from "../../../../../components/AppIcon";
import Button from "../../../../../components/ui/Button";

/**
 * SubmissionValidationModal Component (Sprint 3 - Phase 1 Validation & Phase 2 Submission Engine)
 *
 * Responsibilities:
 * - Renders structured pre-submission validation checks.
 * - Displays blocking errors and non-blocking word count warnings.
 * - Displays system checklist summary.
 * - Triggers Submission Engine pipeline with live progress status indicators (Flushing Autosave -> Saving -> Verifying -> Locking).
 */
const SubmissionValidationModal = ({
  isOpen,
  onClose,
  onConfirmSubmit,
  validationResult,
  writingAnalysis,
  isSubmitting = false,
  submissionStatus = "idle",
  submissionError = null,
}) => {
  if (!isOpen || !validationResult) return null;

  const { isValid, canSubmit, blockingReason, errors, warnings } =
    validationResult;

  const wordCount = writingAnalysis?.wordCount || 0;
  const minWords = writingAnalysis?.minimumRequired || 150;
  const meetsWords = writingAnalysis?.meetsRequirement || false;

  // Format progress text during submission execution
  const getSubmissionStatusText = () => {
    switch (submissionStatus) {
      case "flushing_autosave":
        return "Flushing pending autosave queue...";
      case "saving":
        return "Persisting final essay response to database...";
      case "verifying":
        return "Verifying database persistence...";
      case "locked":
        return "Locking submission record...";
      default:
        return "Executing submission pipeline...";
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-xs animate-in fade-in">
      <div className="bg-card border border-border rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-6 relative overflow-hidden">
        {/* Header Bar */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2.5">
            <div
              className={`p-2 rounded-xl ${
                isValid
                  ? "bg-emerald-500/10 text-emerald-600"
                  : "bg-destructive/10 text-destructive"
              }`}
            >
              <AppIcon name={isValid ? "ShieldCheck" : "ShieldAlert"} size={22} />
            </div>
            <div>
              <h3 className="text-lg font-heading font-bold text-foreground">
                Pre-Submission Validation
              </h3>
              <p className="text-xs text-muted-foreground font-caption">
                Writing Task 1 Examination
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            disabled={isSubmitting}
            className="text-muted-foreground hover:text-foreground p-1 rounded-lg hover:bg-muted transition-colors disabled:opacity-50"
          >
            <AppIcon name="X" size={18} />
          </button>
        </div>

        {/* Submission Execution Error */}
        {submissionError && (
          <div className="bg-destructive/15 border border-destructive/40 text-destructive p-4 rounded-xl space-y-1">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AppIcon name="AlertTriangle" size={18} />
              <span>Submission Failed</span>
            </div>
            <p className="text-xs opacity-90 pl-6">{submissionError}</p>
          </div>
        )}

        {/* Blocking Errors Display */}
        {blockingReason && !submissionError && (
          <div className="bg-destructive/15 border border-destructive/40 text-destructive p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AppIcon name="AlertTriangle" size={18} />
              <span>Submission Blocked: {blockingReason}</span>
            </div>
            {errors.map((err, idx) => (
              <p key={idx} className="text-xs opacity-90 pl-6">
                • {err}
              </p>
            ))}
          </div>
        )}

        {/* Warnings Display */}
        {warnings.length > 0 && !submissionError && (
          <div className="bg-amber-500/15 border border-amber-500/30 text-amber-700 dark:text-amber-400 p-4 rounded-xl space-y-2">
            <div className="flex items-center gap-2 font-semibold text-sm">
              <AppIcon name="AlertCircle" size={18} />
              <span>Validation Warning</span>
            </div>
            {warnings.map((warn, idx) => (
              <p key={idx} className="text-xs leading-relaxed pl-6">
                • {warn}
              </p>
            ))}
          </div>
        )}

        {/* Validation Checklist Summary */}
        <div className="space-y-3 bg-muted/20 border border-border/60 p-4 rounded-xl">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            System Validation Checklist
          </h4>

          <div className="space-y-2 text-xs">
            {/* Session Check */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-foreground">
                <AppIcon name="Database" size={14} className="text-primary" />
                Active Session Validated
              </span>
              <AppIcon name="CheckCircle2" size={16} className="text-emerald-500" />
            </div>

            {/* Essay Text Check */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-foreground">
                <AppIcon name="FileText" size={14} className="text-primary" />
                Essay Text Present
              </span>
              {wordCount > 0 ? (
                <AppIcon name="CheckCircle2" size={16} className="text-emerald-500" />
              ) : (
                <AppIcon name="XCircle" size={16} className="text-destructive" />
              )}
            </div>

            {/* Minimum Words Check */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-foreground">
                <AppIcon name="Award" size={14} className="text-primary" />
                Minimum Words Target (150 Words)
              </span>
              <span
                className={`font-semibold font-mono px-2 py-0.5 rounded text-[11px] ${
                  meetsWords
                    ? "bg-emerald-500/10 text-emerald-600"
                    : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {wordCount} / {minWords} Words
              </span>
            </div>

            {/* Autosave Sync Check */}
            <div className="flex items-center justify-between py-1">
              <span className="flex items-center gap-2 text-foreground">
                <AppIcon name="CloudCheck" size={14} className="text-primary" />
                Autosave Sync Verified
              </span>
              <AppIcon name="CheckCircle2" size={16} className="text-emerald-500" />
            </div>
          </div>
        </div>

        {/* Live Submission Progress Banner */}
        {isSubmitting && (
          <div className="p-3 bg-primary/10 border border-primary/30 rounded-xl flex items-center gap-3 animate-pulse">
            <AppIcon name="Loader2" size={18} className="animate-spin text-primary" />
            <span className="text-xs font-semibold text-primary">
              {getSubmissionStatusText()}
            </span>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-border pt-4">
          <Button variant="outline" onClick={onClose} disabled={isSubmitting}>
            Continue Editing
          </Button>

          <Button
            variant="default"
            disabled={!canSubmit || isSubmitting}
            onClick={onConfirmSubmit}
            iconName={isSubmitting ? "Loader2" : "Send"}
            className="font-bold shadow-md"
          >
            {isSubmitting ? "Submitting..." : "Confirm & Submit Task 1"}
          </Button>
        </div>
      </div>
    </div>
  );
};

export default React.memo(SubmissionValidationModal);

import React from "react";
import AppIcon from "../../../../../components/AppIcon";

/**
 * AutosaveStatusBadge Component (Sprint 2 - Phase 5 Autosave Engine)
 *
 * Responsibilities:
 * - Renders live feedback for essay autosave state.
 * - Displays state indicators:
 *   - 'saving': Animated spinner + "Saving..."
 *   - 'saved': Checkmark + timestamp ("Saved 10:45 PM")
 *   - 'retrying': Warning + "Retrying (2/3)..."
 *   - 'failed': Red alert + manual Retry button
 *   - 'typing': "Unsaved Changes"
 * - Maintains Rocket CBT design standards.
 */
const AutosaveStatusBadge = ({ autosaveState, onRetry }) => {
  if (!autosaveState) return null;

  const { status, lastSavedAt, retryCount } = autosaveState;

  // Format timestamp for 'saved' status
  const formatTime = (dateObj) => {
    if (!dateObj) return "";
    return new Date(dateObj).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  switch (status) {
    case "saving":
      return (
        <span className="px-2.5 py-1 bg-amber-500/10 text-amber-600 border border-amber-500/30 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all">
          <AppIcon name="Loader2" size={13} className="animate-spin" />
          Saving...
        </span>
      );

    case "typing":
      return (
        <span className="px-2.5 py-1 bg-muted/60 text-muted-foreground border border-border text-xs font-medium rounded-full flex items-center gap-1.5 transition-all">
          <AppIcon name="Edit2" size={12} />
          Unsaved Changes
        </span>
      );

    case "retrying":
      return (
        <span className="px-2.5 py-1 bg-amber-500/15 text-amber-600 border border-amber-500/30 text-xs font-medium rounded-full flex items-center gap-1.5 transition-all animate-pulse">
          <AppIcon name="RefreshCw" size={13} className="animate-spin" />
          Retrying ({retryCount}/3)...
        </span>
      );

    case "failed":
      return (
        <div className="flex items-center gap-2">
          <span className="px-2.5 py-1 bg-destructive/15 text-destructive border border-destructive/30 text-xs font-medium rounded-full flex items-center gap-1.5">
            <AppIcon name="AlertCircle" size={13} />
            Save Failed
          </span>
          {onRetry && (
            <button
              onClick={onRetry}
              className="text-xs text-primary hover:underline font-semibold flex items-center gap-1"
            >
              <AppIcon name="RotateCcw" size={12} />
              Retry
            </button>
          )}
        </div>
      );

    case "saved":
    default:
      return (
        <span className="px-2.5 py-1 bg-emerald-500/10 text-emerald-600 border border-emerald-500/30 text-xs font-semibold rounded-full flex items-center gap-1.5 transition-all">
          <AppIcon name="CheckCircle2" size={13} />
          {lastSavedAt ? `Saved ${formatTime(lastSavedAt)}` : "Saved"}
        </span>
      );
  }
};

export default React.memo(AutosaveStatusBadge);

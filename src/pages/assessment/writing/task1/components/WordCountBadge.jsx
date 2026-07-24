import React from "react";
import AppIcon from "../../../../../components/AppIcon";

/**
 * WordCountBadge Component (Sprint 2 - Phase 4 Writing Analysis Engine)
 *
 * Responsibilities:
 * - Renders live word count, requirement status badge, and progress bar.
 * - Color-coded visual states:
 *   - Empty / Writing Started
 *   - Below Requirement (< 150 words)
 *   - Requirement Met (>= 150 words)
 * - Supports compact header badge and expanded progress bar modes.
 */
export const WordCountBadge = ({ analysis, compact = false }) => {
  if (!analysis) return null;

  const {
    wordCount = 0,
    minimumRequired = 150,
    meetsRequirement = false,
    progressPercentage = 0,
    status = "empty",
  } = analysis;

  // Status Badge Scheme
  const getBadgeStyle = () => {
    switch (status) {
      case "requirement_met":
        return "bg-emerald-500/15 text-emerald-600 border-emerald-500/30 font-semibold";
      case "below_requirement":
      case "writing_started":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30 font-medium";
      default:
        return "bg-muted/60 text-muted-foreground border-border font-medium";
    }
  };

  const getStatusText = () => {
    switch (status) {
      case "requirement_met":
        return "Requirement Met";
      case "below_requirement":
        return `${minimumRequired - wordCount} words needed`;
      case "writing_started":
        return "Writing Started";
      default:
        return "0 Words";
    }
  };

  // Compact Header Badge
  if (compact) {
    return (
      <div
        className={`flex items-center gap-1.5 px-3 py-1 border text-xs rounded-full transition-all duration-200 ${getBadgeStyle()}`}
      >
        <AppIcon
          name={meetsRequirement ? "CheckCircle2" : "FileText"}
          size={14}
        />
        <span className="font-bold font-mono">{wordCount}</span>
        <span className="opacity-80">/ {minimumRequired} words</span>
      </div>
    );
  }

  // Detailed Progress Bar Footer Panel
  return (
    <div className="space-y-2 w-full pt-2">
      <div className="flex items-center justify-between text-xs font-caption">
        <div className="flex items-center gap-2">
          <span className="text-muted-foreground">Word Count:</span>
          <span className="font-bold font-mono text-sm text-foreground">
            {wordCount}
          </span>
          <span className="text-muted-foreground">/ min {minimumRequired}</span>
        </div>

        <span
          className={`px-2.5 py-0.5 border text-[11px] rounded-full flex items-center gap-1 ${getBadgeStyle()}`}
        >
          <AppIcon
            name={meetsRequirement ? "CheckCircle2" : "Clock"}
            size={12}
          />
          {getStatusText()}
        </span>
      </div>

      {/* Progress Bar Container */}
      <div className="w-full bg-muted/50 h-2 rounded-full overflow-hidden border border-border/40 shadow-inner">
        <div
          className={`h-full transition-all duration-300 rounded-full ${
            meetsRequirement
              ? "bg-emerald-500 shadow-xs"
              : progressPercentage > 50
              ? "bg-amber-500"
              : "bg-primary"
          }`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
    </div>
  );
};

export default React.memo(WordCountBadge);

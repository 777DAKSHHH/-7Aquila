import React from "react";
import AppIcon from "../../../../../components/AppIcon";
import { DIFFICULTY_BADGES } from "../constants/task1Constants";

/**
 * QuestionMetadataPanel Component (Phase 2 - Question Rendering Engine)
 *
 * Responsibilities:
 * - Displays dynamic metadata for the loaded Writing Task 1 question.
 * - Shows Question Code, Question Type, Difficulty, Minimum Word Requirement, Time Limit, and Module.
 * - Adheres strictly to Rocket CBT platform card design and typography.
 */
const QuestionMetadataPanel = ({ metadata }) => {
  if (!metadata) return null;

  const {
    code,
    questionTypeLabel,
    difficulty,
    minWords,
    timeLimitMinutes,
    module,
  } = metadata;

  // Resolve difficulty badge color scheme
  const diffScheme = DIFFICULTY_BADGES[difficulty] || {
    label: difficulty,
    variant: "warning",
  };

  const getDifficultyClass = (variant) => {
    switch (variant) {
      case "success":
        return "bg-emerald-500/10 text-emerald-600 border-emerald-500/30";
      case "danger":
        return "bg-destructive/15 text-destructive border-destructive/30";
      default:
        return "bg-amber-500/10 text-amber-600 border-amber-500/30";
    }
  };

  return (
    <div className="bg-card border border-border rounded-xl p-4 shadow-xs flex flex-wrap items-center justify-between gap-3">
      {/* Question Code & Module */}
      <div className="flex items-center gap-3">
        <div className="p-2 bg-primary/10 text-primary rounded-lg font-mono font-bold text-xs tracking-wider flex items-center gap-1.5">
          <AppIcon name="Hash" size={14} />
          {code}
        </div>
        <div>
          <span className="text-xs font-semibold text-foreground flex items-center gap-1">
            <AppIcon name="Award" size={14} className="text-primary" />
            {module} Module
          </span>
          <span className="text-[11px] text-muted-foreground block">
            Standard IELTS Test
          </span>
        </div>
      </div>

      {/* Metadata Pills */}
      <div className="flex items-center gap-2 flex-wrap">
        {/* Question Type */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-secondary/20 text-secondary-foreground border border-secondary/30 text-xs font-semibold rounded-full">
          <AppIcon name="PieChart" size={13} />
          <span>{questionTypeLabel}</span>
        </div>

        {/* Difficulty */}
        <div
          className={`flex items-center gap-1.5 px-3 py-1 border text-xs font-semibold rounded-full capitalize ${getDifficultyClass(
            diffScheme.variant
          )}`}
        >
          <AppIcon name="Activity" size={13} />
          <span>{diffScheme.label}</span>
        </div>

        {/* Min Words */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-primary/10 text-primary border border-primary/20 text-xs font-semibold rounded-full">
          <AppIcon name="FileText" size={13} />
          <span>Min {minWords} Words</span>
        </div>

        {/* Time Limit */}
        <div className="flex items-center gap-1.5 px-3 py-1 bg-accent/20 text-accent-foreground border border-accent/30 text-xs font-semibold rounded-full">
          <AppIcon name="Clock" size={13} />
          <span>{timeLimitMinutes} Min</span>
        </div>
      </div>
    </div>
  );
};

export default React.memo(QuestionMetadataPanel);

import React from "react";
import AppIcon from "../../../../../components/AppIcon";

/**
 * QuestionTimerDisplay Component (Sprint 2 - Phase 3 Timer Engine)
 *
 * Responsibilities:
 * - Displays live CBT countdown timer clock.
 * - Applies visual warning threshold styling:
 *   - Normal (> 5 min): Neutral / blue theme
 *   - Warning (<= 5 min): Amber / yellow warning pill
 *   - Critical (<= 1 min): Urgent pulsing red alert
 *   - Expired (= 0s): Solid red expired badge
 */
const QuestionTimerDisplay = ({
  formattedTime = "20:00",
  warningState = "normal",
  isExpired = false,
}) => {
  const getContainerStyle = () => {
    switch (warningState) {
      case "expired":
        return "bg-destructive text-destructive-foreground border-destructive shadow-md";
      case "critical":
        return "bg-destructive/15 text-destructive border-destructive/40 animate-pulse font-bold";
      case "warning":
        return "bg-amber-500/15 text-amber-600 border-amber-500/30";
      default:
        return "bg-card border-border text-foreground";
    }
  };

  const getSubtext = () => {
    switch (warningState) {
      case "expired":
        return "Time Expired";
      case "critical":
        return "Final Minute!";
      case "warning":
        return "5 Mins Left";
      default:
        return "Time Remaining";
    }
  };

  return (
    <div
      className={`flex items-center gap-3 px-4 py-2 border rounded-xl transition-all duration-300 ${getContainerStyle()}`}
    >
      <div
        className={`p-2 rounded-lg ${
          isExpired
            ? "bg-white/20 text-white"
            : warningState === "critical"
            ? "bg-destructive/20 text-destructive"
            : warningState === "warning"
            ? "bg-amber-500/20 text-amber-600"
            : "bg-primary/10 text-primary"
        }`}
      >
        <AppIcon name={isExpired ? "AlertOctagon" : "Clock"} size={20} />
      </div>

      <div>
        <div className="flex items-center gap-1.5 font-mono text-xl font-bold tracking-wider leading-none">
          <span>{formattedTime}</span>
        </div>
        <span className="text-[10px] font-caption font-medium opacity-85 uppercase tracking-wider block mt-0.5">
          {getSubtext()}
        </span>
      </div>
    </div>
  );
};

export default React.memo(QuestionTimerDisplay);

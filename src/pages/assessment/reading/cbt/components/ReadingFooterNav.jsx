import React from "react";
import AppIcon from "components/AppIcon";
import Button from "components/ui/Button";

const ReadingFooterNav = ({
  totalQuestions = 40,
  activeQuestionNumber = 1,
  userAnswers = {},
  flaggedQuestions = [],
  onQuestionSelect,
  onToggleFlag,
  onSubmitClick,
  isSubmitting = false
}) => {
  // Check if a specific question number has an answer submitted
  const isAnswered = (num) => {
    const ans = userAnswers[String(num)];
    if (ans === undefined || ans === null) return false;
    if (Array.isArray(ans)) return ans.length > 0;
    return String(ans).trim() !== "";
  };

  const isFlagged = (num) => flaggedQuestions.includes(num);

  const handleQuestionClick = (num) => {
    onQuestionSelect(num);
    // Smooth scroll to the question element in the DOM
    const questionElement = document.getElementById(`question-${num}`);
    if (questionElement) {
      questionElement.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  };

  const activeIsFlagged = isFlagged(activeQuestionNumber);

  return (
    <footer className="fixed bottom-0 left-0 right-0 z-50 bg-card border-t border-border shadow-lg p-4 select-none">
      <div className="container mx-auto flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Left Side: Review Flag Actions */}
        <div className="flex items-center gap-4 w-full md:w-auto">
          <Button
            variant={activeIsFlagged ? "primary" : "outline"}
            size="sm"
            onClick={() => onToggleFlag(activeQuestionNumber)}
            className={activeIsFlagged ? "bg-amber-500 hover:bg-amber-600 border-amber-500 text-white" : ""}
          >
            <span className="flex items-center gap-2">
              <AppIcon name="Bookmark" size={16} />
              {activeIsFlagged ? "Unflag Question" : "Flag for Review"}
            </span>
          </Button>
          <div className="text-xs text-muted-foreground hidden sm:block">
            Active Question: <span className="font-bold text-foreground">#{activeQuestionNumber}</span>
          </div>
        </div>

        {/* Center: Question Navigation Palette (1-40) */}
        <div className="flex-1 overflow-x-auto w-full max-w-2xl px-2">
          <div className="flex items-center gap-1.5 py-1 min-w-[650px] justify-start md:justify-center">
            {Array.from({ length: totalQuestions }, (_, idx) => {
              const qNum = idx + 1;
              const active = qNum === activeQuestionNumber;
              const answered = isAnswered(qNum);
              const flagged = isFlagged(qNum);

              let btnClasses = "w-8 h-8 rounded-lg flex items-center justify-center text-xs font-mono font-bold transition-all duration-base border relative ";

              if (active) {
                btnClasses += "bg-primary text-primary-foreground border-primary scale-110 shadow-md z-10";
              } else if (flagged) {
                btnClasses += "bg-amber-50 border-amber-300 text-amber-800 hover:bg-amber-100";
              } else if (answered) {
                btnClasses += "bg-muted/80 border-border/80 text-foreground hover:bg-muted/100";
              } else {
                btnClasses += "bg-card border-border hover:bg-muted/40 text-muted-foreground";
              }

              return (
                <button
                  key={qNum}
                  onClick={() => handleQuestionClick(qNum)}
                  className={btnClasses}
                  title={`Question ${qNum}`}
                >
                  {qNum}
                  {flagged && (
                    <span className="absolute -top-1 -right-1 w-2.5 h-2.5 bg-amber-500 rounded-full border border-card"></span>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Right Side: Submission Action */}
        <div className="w-full md:w-auto flex justify-end">
          <Button
            variant="primary"
            onClick={onSubmitClick}
            disabled={isSubmitting}
            className="px-6"
          >
            {isSubmitting ? "Submitting..." : "Submit Test"}
          </Button>
        </div>
      </div>
    </footer>
  );
};

export default ReadingFooterNav;

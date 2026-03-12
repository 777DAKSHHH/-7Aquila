import React from 'react';
import Icon from '../AppIcon';

const TestProgressIndicator = ({
  currentPart = 1,
  totalParts = 3,
  currentQuestion = 1,
  totalQuestions = 4,
  partTitles = ['Introduction', 'Long Turn', 'Discussion'],
  onPartClick = null,
}) => {
  const progressPercentage = ((currentPart - 1) / totalParts) * 100 + (1 / totalParts) * ((currentQuestion - 1) / totalQuestions) * 100;

  return (
    <div className="bg-card rounded-lg p-6 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground">
            Part {currentPart} of {totalParts}
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            {partTitles?.[currentPart - 1]}
          </p>
        </div>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-muted rounded-md">
          <Icon name="MessageSquare" size={16} color="var(--color-primary)" />
          <span className="text-sm font-medium mono text-foreground">
            Question {currentQuestion}/{totalQuestions}
          </span>
        </div>
      </div>
      <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden mb-6">
        <div
          className="absolute top-0 left-0 h-full bg-primary transition-all duration-500 ease-out"
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      <div className="grid grid-cols-3 gap-3">
        {Array.from({ length: totalParts }, (_, index) => {
          const partNumber = index + 1;
          const isCompleted = partNumber < currentPart;
          const isCurrent = partNumber === currentPart;
          const isClickable = onPartClick && (isCompleted || isCurrent);

          return (
            <button
              key={partNumber}
              onClick={() => isClickable && onPartClick(partNumber)}
              disabled={!isClickable}
              className={`flex flex-col items-center gap-2 p-3 rounded-md transition-all duration-base ${
                isCurrent
                  ? 'bg-primary text-primary-foreground shadow-sm'
                  : isCompleted
                  ? 'bg-success/10 text-success hover:bg-success/20' :'bg-muted text-muted-foreground'
              } ${isClickable ? 'cursor-pointer active:scale-[0.98]' : 'cursor-default'}`}
            >
              <div className="flex items-center justify-center w-8 h-8 rounded-full bg-current/10">
                {isCompleted ? (
                  <Icon name="Check" size={16} />
                ) : (
                  <span className="text-sm font-semibold mono">{partNumber}</span>
                )}
              </div>
              <span className="text-xs font-caption font-medium">{partTitles?.[index]}</span>
            </button>
          );
        })}
      </div>
      <div className="mt-4 pt-4 border-t border-border">
        <div className="flex items-center justify-between text-sm">
          <span className="text-muted-foreground font-caption">Overall Progress</span>
          <span className="font-semibold mono text-foreground">
            {Math.round(progressPercentage)}%
          </span>
        </div>
      </div>
    </div>
  );
};

export default TestProgressIndicator;
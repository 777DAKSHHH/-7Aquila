import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ComparisonModal = ({ isOpen, onClose, attempts = [] }) => {
  if (!isOpen) return null;

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-error';
  };

  const calculateDifference = (score1, score2) => {
    const diff = score2 - score1;
    return diff > 0 ? `+${diff?.toFixed(1)}` : diff?.toFixed(1);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
      <div className="bg-card rounded-lg border border-border shadow-lg max-w-4xl w-full max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between p-4 md:p-6 border-b border-border">
          <h2 className="text-xl md:text-2xl font-heading font-bold text-foreground">
            Compare Attempts
          </h2>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
            aria-label="Close modal"
          >
            <Icon name="X" size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 md:p-6">
          {attempts?.length < 2 ? (
            <div className="text-center py-12">
              <Icon name="AlertCircle" size={48} className="mx-auto mb-3 opacity-30" />
              <p className="text-muted-foreground font-caption">
                Select at least 2 attempts to compare
              </p>
            </div>
          ) : (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {attempts?.slice(0, 2)?.map((attempt, index) => (
                  <div key={attempt?.id} className="bg-muted/30 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-xs font-caption text-muted-foreground">
                        Attempt {index + 1}
                      </span>
                      <span className="text-xs font-caption text-muted-foreground">
                        {attempt?.date}
                      </span>
                    </div>
                    <h3 className="text-base font-heading font-semibold text-foreground mb-2">
                      {attempt?.topic}
                    </h3>
                    <div className="flex items-center justify-center py-4">
                      <div className="text-center">
                        <span className={`text-4xl font-heading font-bold ${getScoreColor(attempt?.overallScore)}`}>
                          {attempt?.overallScore}
                        </span>
                        <p className="text-xs text-muted-foreground font-caption mt-1">
                          Overall Band
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {attempts?.length === 2 && (
                <div className="bg-card rounded-lg border border-border p-4 md:p-6">
                  <h4 className="text-base md:text-lg font-heading font-semibold text-foreground mb-4">
                    Score Comparison
                  </h4>
                  <div className="space-y-4">
                    {[
                      { label: 'Overall Score', key: 'overallScore' },
                      { label: 'Fluency & Coherence', key: 'fluency' },
                      { label: 'Lexical Resource', key: 'lexical' },
                      { label: 'Grammar Range & Accuracy', key: 'grammar' },
                      { label: 'Pronunciation', key: 'pronunciation' }
                    ]?.map((criteria) => {
                      const score1 = attempts?.[0]?.[criteria?.key];
                      const score2 = attempts?.[1]?.[criteria?.key];
                      const diff = calculateDifference(score1, score2);
                      const isImprovement = score2 > score1;

                      return (
                        <div key={criteria?.key} className="flex items-center justify-between">
                          <span className="text-sm font-medium text-foreground">
                            {criteria?.label}
                          </span>
                          <div className="flex items-center gap-4">
                            <span className={`text-sm font-semibold ${getScoreColor(score1)}`}>
                              {score1}
                            </span>
                            <Icon
                              name={isImprovement ? 'ArrowRight' : 'ArrowRight'}
                              size={16}
                              color="var(--color-muted-foreground)"
                            />
                            <span className={`text-sm font-semibold ${getScoreColor(score2)}`}>
                              {score2}
                            </span>
                            <span
                              className={`text-sm font-semibold ${
                                isImprovement ? 'text-success' : 'text-error'
                              }`}
                            >
                              ({diff})
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="flex items-center justify-end gap-3 p-4 md:p-6 border-t border-border">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </div>
      </div>
    </div>
  );
};

export default ComparisonModal;
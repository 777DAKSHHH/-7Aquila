import React from 'react';
import Icon from '../../../components/AppIcon';

const ErrorAnalysisPanel = ({ errors }) => {
  if (!errors || !errors.length) return null;

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-md border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-error/10 flex items-center justify-center flex-shrink-0">
          <Icon name="AlertTriangle" size={20} color="var(--color-error)" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Error Analysis
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            Grammar and phrasing mistakes with examiner corrections
          </p>
        </div>
      </div>

      <div className="space-y-5">
        {errors.map((err, idx) => (
          <div key={idx} className="flex flex-col gap-2 pb-5 border-b border-border last:border-0 last:pb-0">
            <div className="px-3 py-2 rounded-md bg-error/10 border border-error/20 text-sm md:text-base text-error-foreground font-medium">
              <span className="text-xs font-bold text-error uppercase mr-2 opacity-80">Mistake:</span> {err.original || err.mistake}
            </div>
            <div className="px-3 py-2 rounded-md bg-success/10 border border-success/20 text-sm md:text-base text-success-foreground font-medium">
              <span className="text-xs font-bold text-success uppercase mr-2 opacity-80">Correction:</span> {err.correction || err.improved}
            </div>
            <p className="text-sm text-muted-foreground mt-1 px-1">{err.explanation || err.reason}</p>
          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorAnalysisPanel;
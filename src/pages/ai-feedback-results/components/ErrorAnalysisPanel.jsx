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
        {errors?.map((error, index) => (
          <div key={index} className="rounded-xl border border-border p-4 space-y-3">
            
            <div>
              <p className="text-sm font-semibold text-red-600">
                Mistake
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {error.original || error.mistake}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-green-600">
                Correction
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {error.correction || error.improved}
              </p>
            </div>

            <div>
              <p className="text-sm font-semibold text-blue-600">
                Explanation
              </p>
              <p className="text-sm text-gray-700 dark:text-gray-300">
                {error.explanation || error.reason}
              </p>
            </div>

          </div>
        ))}
      </div>
    </div>
  );
};

export default ErrorAnalysisPanel;
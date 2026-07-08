import React from 'react';
import Icon from '../../../components/AppIcon';

const TeacherFeedbackDisplay = ({ feedback }) => {
  if (!feedback || !feedback.trim()) {
    return null;
  }

  return (
    <div className="bg-primary/5 rounded-lg p-4 md:p-6 shadow-sm border border-primary/20">
      <div className="flex items-start gap-3">
        <Icon name="UserCheck" size={24} className="text-primary mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg font-heading font-semibold text-foreground mb-2">
            Faculty Feedback
          </h3>
          <div className="prose prose-sm max-w-none font-caption text-muted-foreground">
            <p>{feedback}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeedbackDisplay;
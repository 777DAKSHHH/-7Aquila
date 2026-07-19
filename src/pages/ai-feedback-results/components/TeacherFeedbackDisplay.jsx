import React from 'react';
import Icon from '../../../components/AppIcon';

const TeacherFeedbackDisplay = ({ session }) => {
  if (!session?.teacher_feedback) {
    return null;
  }

  const reviewDate = session.reviewed_at
    ? new Date(session.reviewed_at).toLocaleDateString(undefined, { year: 'numeric', month: 'long', day: 'numeric' })
    : null;

  return (
    <div className="bg-primary/5 rounded-lg p-4 md:p-6 shadow-sm border border-primary/20">
      <div className="flex items-start gap-3">
        <Icon name="UserCheck" size={24} className="text-primary mt-1 flex-shrink-0" />
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-1">
            Faculty Review
          </h3>
          {reviewDate && (
            <p className="text-xs text-muted-foreground font-caption mb-3">
              Reviewed on {reviewDate}
            </p>
          )}
          <div className="prose prose-sm max-w-none font-caption text-muted-foreground">
            <p>{session.teacher_feedback}</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TeacherFeedbackDisplay;
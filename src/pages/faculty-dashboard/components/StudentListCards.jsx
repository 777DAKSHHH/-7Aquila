import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StudentListCards = ({ students = [], onViewAttempts, onAddFeedback }) => {
  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const getScoreColor = (score) => {
    if (score >= 7.0) return 'text-success';
    if (score >= 6.0) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="grid grid-cols-1 gap-4">
      {students?.map((student) => (
        <div
          key={student?.id}
          className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all duration-base"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={24} color="var(--color-primary)" />
            </div>
            <div className="flex-1 min-w-0">
              <h3 className="font-heading font-semibold text-foreground">{student?.name}</h3>
              <p className="text-sm text-muted-foreground font-caption truncate">{student?.email}</p>
              <p className="text-sm font-mono text-muted-foreground mt-1">{student?.studentId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Last Attempt</p>
              <p className="text-sm font-medium text-foreground">{student?.lastAttempt}</p>
            </div>
            <div>
              <p className="text-xs text-muted-foreground font-caption mb-1">Latest Score</p>
              <p className={`text-2xl font-semibold mono ${getScoreColor(student?.latestScore)}`}>
                {student?.latestScore?.toFixed(1)}
              </p>
            </div>
          </div>

          <div className="mb-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-xs text-muted-foreground font-caption">Progress</p>
              <span className="text-sm font-medium mono text-foreground">
                {student?.progressPercentage}%
              </span>
            </div>
            <div className="h-2 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(student?.progressPercentage)} transition-all duration-500`}
                style={{ width: `${student?.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              iconName="Eye"
              iconPosition="left"
              onClick={() => onViewAttempts(student?.id)}
              fullWidth
            >
              View Attempts
            </Button>
            <Button
              variant="default"
              size="sm"
              iconName="MessageSquare"
              iconPosition="left"
              onClick={() => onAddFeedback(student?.id)}
              fullWidth
            >
              Add Feedback
            </Button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentListCards;
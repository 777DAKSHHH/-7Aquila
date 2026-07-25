import React from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StudentListCards = ({ 
  students = [], 
  onViewAttempts, 
  onAddFeedback, 
  activeModule = 'speaking',
  onViewProfile 
}) => {
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
          className="bg-card rounded-lg border border-border p-4 hover:shadow-md transition-all text-xs"
        >
          <div className="flex items-start gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
              <Icon name="User" size={20} className="text-primary" />
            </div>
            <div className="flex-1 min-w-0">
              <button
                type="button"
                onClick={() => onViewProfile?.(student.id)}
                className="font-heading font-semibold text-foreground text-sm hover:text-primary hover:underline text-left block"
              >
                {student?.name}
              </button>
              <p className="text-[10px] text-muted-foreground font-caption truncate">{student?.email}</p>
              <p className="text-[10px] font-mono text-muted-foreground mt-0.5">{student?.studentId}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4 mb-4">
            <div>
              <p className="text-[10px] text-muted-foreground font-caption mb-0.5">Last Attempt</p>
              <p className="text-sm font-medium text-foreground">{student?.lastAttempt}</p>
            </div>
            <div>
              <p className="text-[10px] text-muted-foreground font-caption mb-0.5">
                {activeModule === 'speaking' || activeModule === 'writing' ? 'Band Score' : 'Band / Raw Score'}
              </p>
              <p className={`text-base font-bold font-mono ${getScoreColor(student?.latestScore)}`}>
                {student?.latestScore > 0 ? student?.latestScore?.toFixed(1) : "0.0"} 
                { (activeModule === 'reading' || activeModule === 'listening') && ` (${student.raw_score})` }
              </p>
            </div>
          </div>

          {/* Render Speaking Subscores in mobile view */}
          {activeModule === 'speaking' && (
            <div className="bg-muted/30 border border-border/40 p-2.5 rounded-lg grid grid-cols-4 gap-1 text-center font-mono text-[9px] mb-4">
              <div>
                <span className="text-muted-foreground block text-[8px]">FLUENCY</span>
                <span className="font-bold text-foreground">{student.fluency?.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[8px]">LEXICAL</span>
                <span className="font-bold text-foreground">{student.lexical?.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[8px]">GRAMMAR</span>
                <span className="font-bold text-foreground">{student.grammar?.toFixed(1)}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[8px]">PRONUNCIATION</span>
                <span className="font-bold text-foreground">{student.pronunciation?.toFixed(1)}</span>
              </div>
            </div>
          )}

          {/* Render Writing Subscores in mobile view */}
          {activeModule === 'writing' && (
            <div className="bg-muted/30 border border-border/40 p-2.5 rounded-lg grid grid-cols-2 gap-2 text-center font-mono text-[9px] mb-4">
              <div>
                <span className="text-muted-foreground block text-[8px]">TASK 1 BAND</span>
                <span className="font-bold text-foreground">{student.task1Band > 0 ? student.task1Band.toFixed(1) : "N/A"}</span>
              </div>
              <div>
                <span className="text-muted-foreground block text-[8px]">TASK 2 BAND</span>
                <span className="font-bold text-foreground">{student.task2Band > 0 ? student.task2Band.toFixed(1) : "N/A"}</span>
              </div>
            </div>
          )}

          <div className="mb-4">
            <div className="flex items-center justify-between mb-1">
              <p className="text-[10px] text-muted-foreground font-caption">Progress</p>
              <span className="font-mono text-muted-foreground text-[10px]">
                {student?.progressPercentage}%
              </span>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className={`h-full ${getProgressColor(student?.progressPercentage)} transition-all duration-500`}
                style={{ width: `${student?.progressPercentage}%` }}
              />
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              size="xs"
              iconName="Eye"
              iconPosition="left"
              onClick={() => onViewAttempts(student?.id)}
              fullWidth
              className="h-7 text-[10px] font-bold"
            >
              Review Attempts
            </Button>
            {(activeModule === 'speaking' || activeModule === 'writing') && (
              <Button
                variant="default"
                size="xs"
                iconName="MessageSquare"
                iconPosition="left"
                onClick={() => onAddFeedback(student?.id)}
                fullWidth
                className="h-7 text-[10px] font-bold"
              >
                Grade
              </Button>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};

export default StudentListCards;
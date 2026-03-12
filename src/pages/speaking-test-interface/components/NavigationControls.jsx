import React from 'react';
import Button from '../../../components/ui/Button';
import Icon from '../../../components/AppIcon';

const NavigationControls = ({
  canGoBack = false,
  canGoNext = false,
  canSubmit = false,
  onBack = () => {},
  onNext = () => {},
  onSubmit = () => {},
  isLoading = false,
  currentQuestion = 1,
  totalQuestions = 12,
  autoSaveStatus = 'saved'
}) => {
  const getAutoSaveIcon = () => {
    switch(autoSaveStatus) {
      case 'saving': return 'Loader2';
      case 'saved': return 'Check';
      case 'error': return 'AlertCircle';
      default: return 'Cloud';
    }
  };

  const getAutoSaveColor = () => {
    switch(autoSaveStatus) {
      case 'saving': return 'var(--color-warning)';
      case 'saved': return 'var(--color-success)';
      case 'error': return 'var(--color-error)';
      default: return 'var(--color-muted-foreground)';
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm border border-border">
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
        <div className="flex items-center gap-3 order-2 sm:order-1">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-md ${
            autoSaveStatus === 'saving' ? 'bg-warning/10' : 
            autoSaveStatus === 'saved' ? 'bg-success/10' : 
            autoSaveStatus === 'error' ? 'bg-error/10' : 'bg-muted'
          }`}>
            <Icon 
              name={getAutoSaveIcon()} 
              size={16} 
              color={getAutoSaveColor()}
              className={autoSaveStatus === 'saving' ? 'animate-spin' : ''}
            />
            <span className="text-sm font-caption font-medium" style={{ color: getAutoSaveColor() }}>
              {autoSaveStatus === 'saving' && 'Saving...'}
              {autoSaveStatus === 'saved' && 'Auto-saved'}
              {autoSaveStatus === 'error' && 'Save failed'}
              {autoSaveStatus === 'idle' && 'Not saved'}
            </span>
          </div>
          <div className="hidden md:flex items-center gap-2 text-sm text-muted-foreground font-caption">
            <Icon name="FileAudio" size={16} />
            <span>Question {currentQuestion} of {totalQuestions}</span>
          </div>
        </div>

        <div className="flex items-center gap-3 order-1 sm:order-2 w-full sm:w-auto">
          {canGoBack && (
            <Button
              variant="outline"
              size="default"
              iconName="ChevronLeft"
              iconPosition="left"
              onClick={onBack}
              disabled={isLoading}
              className="flex-1 sm:flex-none"
            >
              Previous
            </Button>
          )}
          
          {canGoNext && !canSubmit && (
            <Button
              variant="default"
              size="default"
              iconName="ChevronRight"
              iconPosition="right"
              onClick={onNext}
              disabled={isLoading}
              loading={isLoading}
              className="flex-1 sm:flex-none"
            >
              Next Question
            </Button>
          )}

          {canSubmit && (
            <Button
              variant="success"
              size="default"
              iconName="Send"
              iconPosition="right"
              onClick={onSubmit}
              disabled={isLoading}
              loading={isLoading}
              className="flex-1 sm:flex-none"
            >
              Submit Test
            </Button>
          )}
        </div>
      </div>

      <div className="md:hidden mt-3 pt-3 border-t border-border flex items-center justify-center gap-2 text-sm text-muted-foreground font-caption">
        <Icon name="FileAudio" size={16} />
        <span>Question {currentQuestion} of {totalQuestions}</span>
      </div>
    </div>
  );
};

export default NavigationControls;
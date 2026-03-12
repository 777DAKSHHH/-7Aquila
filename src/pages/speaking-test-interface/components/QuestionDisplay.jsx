import React from 'react';
import Icon from '../../../components/AppIcon';

const QuestionDisplay = ({ 
  part = 1, 
  question = '', 
  questionNumber = 1,
  totalQuestions = 4,
  partTitle = 'Introduction'
}) => {
  const getPartIcon = () => {
    switch(part) {
      case 1: return 'MessageCircle';
      case 2: return 'FileText';
      case 3: return 'Users';
      default: return 'MessageCircle';
    }
  };

  const getPartColor = () => {
    switch(part) {
      case 1: return 'var(--color-primary)';
      case 2: return 'var(--color-accent)';
      case 3: return 'var(--color-secondary)';
      default: return 'var(--color-primary)';
    }
  };

  return (
    <div className="bg-card rounded-lg p-6 md:p-8 lg:p-10 shadow-sm border border-border">
      <div className="flex items-start gap-4 mb-6">
        <div 
          className="w-12 h-12 md:w-14 md:h-14 lg:w-16 lg:h-16 rounded-full flex items-center justify-center flex-shrink-0"
          style={{ backgroundColor: `${getPartColor()}15` }}
        >
          <Icon name={getPartIcon()} size={24} color={getPartColor()} />
        </div>
        <div className="flex-1">
          <div className="flex items-center gap-3 mb-2">
            <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
              Part {part}: {partTitle}
            </h2>
            <span className="px-3 py-1 bg-muted rounded-full text-sm font-caption font-medium text-muted-foreground mono">
              {questionNumber}/{totalQuestions}
            </span>
          </div>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            {part === 1 && "Answer the following questions about yourself and your life"}
            {part === 2 && "Speak for 1-2 minutes on the topic below after 1 minute preparation"}
            {part === 3 && "Discuss abstract ideas and issues related to the topic"}
          </p>
        </div>
      </div>

      <div className="bg-muted/30 rounded-lg p-6 md:p-8 border-l-4" style={{ borderLeftColor: getPartColor() }}>
        <p className="text-base md:text-lg lg:text-xl text-foreground leading-relaxed whitespace-pre-line">
          {question}
        </p>
      </div>

      <div className="mt-6 flex items-center gap-4 text-sm text-muted-foreground">
        <div className="flex items-center gap-2">
          <Icon name="Clock" size={16} />
          <span className="font-caption">
            {part === 1 && "30-45 seconds per question"}
            {part === 2 && "1-2 minutes speaking time"}
            {part === 3 && "4-5 minutes discussion"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="Info" size={16} />
          <span className="font-caption">Speak naturally and clearly</span>
        </div>
      </div>
    </div>
  );
};

export default QuestionDisplay;
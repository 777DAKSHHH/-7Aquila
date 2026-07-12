import React from 'react';
import Icon from '../../../components/AppIcon';

const IdealAnswerPanel = ({ answers }) => {
  if (!answers) return null;
  
  // Handle both string (single answer) and array (multiple answers)
  const answerList = Array.isArray(answers) ? answers : [answers];
  if (!answerList.length || !answerList[0]) return null;

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
          <Icon name="Award" size={20} color="var(--color-primary)" />
        </div>
        <div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Ideal Answer (Band 7+)
          </h3>
          <p className="text-sm text-muted-foreground font-caption">
            Review this examiner-level response structure and vocabulary
          </p>
        </div>
      </div>
      <div className="p-5 md:p-6 rounded-lg bg-accent/5 border border-accent/20 relative shadow-inner">
        <Icon name="Quote" size={28} className="absolute top-4 right-4 text-accent/20" />
        <p className="text-base md:text-lg text-foreground leading-relaxed italic whitespace-pre-line">{answerList[0]?.ideal_answer || answerList[0]}</p>
      </div>
    </div>
  );
};

export default IdealAnswerPanel;
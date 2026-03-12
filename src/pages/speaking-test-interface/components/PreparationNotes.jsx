import React from 'react';
import Icon from '../../../components/AppIcon';

const PreparationNotes = ({ 
  notes = '',
  onNotesChange = () => {},
  isDisabled = false,
  maxLength = 500
}) => {
  const remainingChars = maxLength - notes?.length;
  const isNearLimit = remainingChars < 50;

  return (
    <div className="bg-card rounded-lg p-6 md:p-8 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <Icon name="PenTool" size={20} color="var(--color-primary)" />
          </div>
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Preparation Notes
          </h3>
        </div>
        <span className={`text-sm font-mono font-medium ${isNearLimit ? 'text-warning' : 'text-muted-foreground'}`}>
          {remainingChars} chars left
        </span>
      </div>
      <textarea
        value={notes}
        onChange={(e) => onNotesChange(e?.target?.value)}
        disabled={isDisabled}
        maxLength={maxLength}
        placeholder="Write brief notes here during your preparation time...&#10;&#10;• Key points to mention&#10;• Specific examples&#10;• Important details"
        className="w-full h-48 md:h-56 lg:h-64 p-4 bg-muted/30 border border-border rounded-lg text-base text-foreground placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-transparent resize-none font-body leading-relaxed disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-base"
      />
      <div className="mt-4 flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
        <Icon name="Info" size={18} color="var(--color-primary)" className="flex-shrink-0 mt-0.5" />
        <p className="text-sm text-muted-foreground font-caption leading-relaxed">
          These notes are for your reference only and won't be submitted. Use bullet points and keywords to organize your thoughts during the 1-minute preparation time.
        </p>
      </div>
    </div>
  );
};

export default PreparationNotes;
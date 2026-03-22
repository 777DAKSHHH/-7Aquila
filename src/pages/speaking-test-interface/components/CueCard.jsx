import React from 'react';
import Icon from '../../../components/AppIcon';

const CueCard = ({ 
  topic = '',
  bulletPoints = [],
  isPreparationTime = false,
  preparationTimeLeft = 75
}) => {
  return (
    <div className="bg-card rounded-lg shadow-md border-2 border-accent">
      <div className="bg-accent/10 px-6 py-4 border-b border-accent/20">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-accent/20 flex items-center justify-center">
              <Icon name="FileText" size={20} color="var(--color-accent)" />
            </div>
            <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
              Cue Card - Part 2
            </h3>
          </div>
          {isPreparationTime && (
            <div className="flex items-center gap-2 px-3 py-1.5 bg-warning/10 rounded-md border border-warning/20">
              <Icon name="Clock" size={16} color="var(--color-warning)" />
              <span className="text-sm font-mono font-semibold text-warning">
                {Math.floor(preparationTimeLeft / 60)}:{String(preparationTimeLeft % 60)?.padStart(2, '0')}
              </span>
            </div>
          )}
        </div>
      </div>
      <div className="p-6 md:p-8 lg:p-10">
        <div className="mb-6">
          <p className="text-sm md:text-base text-muted-foreground font-caption mb-3">
            Describe:
          </p>
          <h4 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground leading-relaxed">
            {topic}
          </h4>
        </div>

        <div className="space-y-4">
          <p className="text-sm md:text-base text-muted-foreground font-caption font-medium">
            You should say:
          </p>
          <ul className="space-y-3">
            {bulletPoints?.map((point, index) => (
              <li key={index} className="flex items-start gap-3">
                <div className="w-6 h-6 rounded-full bg-accent/10 flex items-center justify-center flex-shrink-0 mt-0.5">
                  <span className="text-sm font-semibold text-accent mono">{index + 1}</span>
                </div>
                <p className="text-base md:text-lg text-foreground flex-1 leading-relaxed">
                  {point}
                </p>
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-8 pt-6 border-t border-border">
          <div className="flex items-start gap-3 p-4 bg-muted/30 rounded-lg">
            <Icon name="Lightbulb" size={20} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-sm md:text-base text-foreground font-medium mb-1">
                Preparation Tips:
              </p>
              <p className="text-sm text-muted-foreground font-caption leading-relaxed">
                Use your 1 minute and 15 seconds preparation time to make brief notes. Think about specific examples and details you can include. Aim to speak for 1-2 minutes without stopping.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CueCard;
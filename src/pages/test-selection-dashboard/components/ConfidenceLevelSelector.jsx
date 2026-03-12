import React from 'react';
import Icon from '../../../components/AppIcon';

const ConfidenceLevelSelector = ({ selectedLevel, onLevelChange }) => {
  const levels = [
    {
      id: 'beginner',
      label: 'Beginner',
      icon: 'Sprout',
      description: 'Just starting IELTS preparation',
      color: 'var(--color-warning)',
    },
    {
      id: 'intermediate',
      label: 'Intermediate',
      icon: 'Zap',
      description: 'Some practice completed',
      color: 'var(--color-accent)',
    },
    {
      id: 'advanced',
      label: 'Advanced',
      icon: 'Flame',
      description: 'Confident and experienced',
      color: 'var(--color-success)',
    },
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm border border-border">
      <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-4">
        Your Confidence Level
      </h3>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 md:gap-4">
        {levels?.map((level) => {
          const isSelected = selectedLevel === level?.id;
          return (
            <button
              key={level?.id}
              onClick={() => onLevelChange(level?.id)}
              className={`flex flex-col items-center gap-3 p-4 rounded-lg border-2 transition-all duration-base ${
                isSelected
                  ? 'border-primary bg-primary/10 shadow-sm'
                  : 'border-border bg-background hover:bg-muted'
              }`}
            >
              <div
                className={`w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center ${
                  isSelected ? 'bg-primary/20' : 'bg-muted'
                }`}
              >
                <Icon name={level?.icon} size={24} color={isSelected ? level?.color : 'var(--color-muted-foreground)'} />
              </div>
              <div className="text-center">
                <p className={`font-medium text-sm md:text-base ${isSelected ? 'text-primary' : 'text-foreground'}`}>
                  {level?.label}
                </p>
                <p className="text-xs text-muted-foreground font-caption mt-1">
                  {level?.description}
                </p>
              </div>
            </button>
          );
        })}
      </div>
    </div>
  );
};

export default ConfidenceLevelSelector;
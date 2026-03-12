import React from 'react';
import { useNavigate } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TestTopicCard = ({ test }) => {
  const navigate = useNavigate();

  const getDifficultyColor = (difficulty) => {
    switch (difficulty?.toLowerCase()) {
      case 'easy':
        return 'text-success bg-success/10';
      case 'medium':
        return 'text-warning bg-warning/10';
      case 'hard':
        return 'text-error bg-error/10';
      default:
        return 'text-muted-foreground bg-muted';
    }
  };

  const handleStartTest = () => {
    navigate(`/speaking-test-interface?testSetId=${test?.id}`);
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 shadow-sm border border-border hover:shadow-md transition-all duration-base">
      <div className="flex items-start justify-between mb-4">
        <div className="flex-1">
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground mb-2">
            {test?.name}
          </h3>
          <p className="text-sm md:text-base text-muted-foreground font-caption line-clamp-2">
            {test?.description}
          </p>
        </div>
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0 ml-3">
          <Icon name="MessageSquare" size={20} color="var(--color-primary)" />
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-2 md:gap-3 mb-4">
        <span className={`px-3 py-1 rounded-full text-xs md:text-sm font-medium font-caption ${getDifficultyColor(test?.difficulty)}`}>
          {test?.difficulty}
        </span>
        <div className="flex items-center gap-1 text-muted-foreground">
          <Icon name="Clock" size={16} />
          <span className="text-xs md:text-sm font-caption">15 min</span>
        </div>
        {test?.previousAttempts > 0 && (
          <div className="flex items-center gap-1 text-muted-foreground">
            <Icon name="RotateCcw" size={16} />
            <span className="text-xs md:text-sm font-caption">{test?.previousAttempts} attempts</span>
          </div>
        )}
      </div>
      <div className="space-y-2 mb-4">
        <div className="flex items-center gap-2">
          <Icon name="CheckCircle2" size={16} color="var(--color-success)" />
          <span className="text-xs md:text-sm text-foreground font-caption">Part 1: 7 questions</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="CheckCircle2" size={16} color="var(--color-success)" />
          <span className="text-xs md:text-sm text-foreground font-caption">Part 2: Cue card with 1 min prep</span>
        </div>
        <div className="flex items-center gap-2">
          <Icon name="CheckCircle2" size={16} color="var(--color-success)" />
          <span className="text-xs md:text-sm text-foreground font-caption">Part 3: 4 discussion questions</span>
        </div>
      </div>
      <Button
        variant="default"
        size="lg"
        iconName="Play"
        iconPosition="left"
        onClick={handleStartTest}
        fullWidth
      >
        Start Test
      </Button>
      {test?.lastAttemptScore && (
        <div className="mt-3 pt-3 border-t border-border flex items-center justify-between">
          <span className="text-xs md:text-sm text-muted-foreground font-caption">Last Score:</span>
          <span className="text-sm md:text-base font-semibold mono text-primary">Band {test?.lastAttemptScore}</span>
        </div>
      )}
    </div>
  );
};

export default TestTopicCard;
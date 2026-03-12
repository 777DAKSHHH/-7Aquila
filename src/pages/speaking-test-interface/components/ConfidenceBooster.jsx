import React, { useState, useEffect } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const ConfidenceBooster = ({ 
  onClose = () => {},
  autoCloseDelay = 10000
}) => {
  const [currentTipIndex, setCurrentTipIndex] = useState(0);
  const [isBreathing, setIsBreathing] = useState(false);

  const tips = [
    {
      icon: 'Smile',
      title: 'Stay Calm & Confident',
      message: 'Take a deep breath. Remember, the examiner wants you to succeed. Speak naturally as if talking to a friend.',
      color: 'var(--color-success)'
    },
    {
      icon: 'Volume2',
      title: 'Speak Clearly',
      message: 'Don\'t rush your words. It\'s okay to pause and think. Clear pronunciation is more important than speed.',
      color: 'var(--color-primary)'
    },
    {
      icon: 'MessageCircle',
      title: 'Elaborate Your Answers',
      message: 'Give detailed responses with examples. Instead of "Yes, I like reading," say "Yes, I enjoy reading mystery novels because they keep me engaged."',
      color: 'var(--color-accent)'
    },
    {
      icon: 'CheckCircle',
      title: 'You\'re Ready!',
      message: 'Trust your preparation. Focus on communicating your ideas clearly. Good luck with your test!',
      color: 'var(--color-success)'
    }
  ];

  useEffect(() => {
    const timer = setTimeout(() => {
      onClose();
    }, autoCloseDelay);

    return () => clearTimeout(timer);
  }, [autoCloseDelay, onClose]);

  useEffect(() => {
    if (currentTipIndex < tips?.length - 1) {
      const interval = setInterval(() => {
        setCurrentTipIndex(prev => prev + 1);
      }, 2500);

      return () => clearInterval(interval);
    }
  }, [currentTipIndex, tips?.length]);

  const currentTip = tips?.[currentTipIndex];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="bg-card rounded-lg shadow-2xl border border-border max-w-2xl w-full p-8 md:p-10 lg:p-12 animate-scale-in">
        <div className="flex items-start justify-between mb-6">
          <div className="flex items-center gap-3">
            <div 
              className="w-12 h-12 md:w-14 md:h-14 rounded-full flex items-center justify-center"
              style={{ backgroundColor: `${currentTip?.color}15` }}
            >
              <Icon name={currentTip?.icon} size={24} color={currentTip?.color} />
            </div>
            <div>
              <h2 className="text-2xl md:text-3xl font-heading font-semibold text-foreground">
                {currentTip?.title}
              </h2>
              <p className="text-sm text-muted-foreground font-caption">
                Tip {currentTipIndex + 1} of {tips?.length}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
            aria-label="Close confidence booster"
          >
            <Icon name="X" size={20} />
          </button>
        </div>

        <p className="text-lg md:text-xl text-foreground leading-relaxed mb-8">
          {currentTip?.message}
        </p>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-muted-foreground font-caption">Progress</span>
            <span className="text-sm font-mono font-medium text-foreground">
              {Math.round(((currentTipIndex + 1) / tips?.length) * 100)}%
            </span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out"
              style={{ width: `${((currentTipIndex + 1) / tips?.length) * 100}%` }}
            />
          </div>
        </div>

        <div className="flex flex-col sm:flex-row items-center gap-4">
          <Button
            variant="outline"
            size="lg"
            iconName={isBreathing ? 'Pause' : 'Wind'}
            iconPosition="left"
            onClick={() => setIsBreathing(!isBreathing)}
            className="w-full sm:w-auto"
          >
            {isBreathing ? 'Stop' : 'Start'} Breathing Exercise
          </Button>
          <Button
            variant="default"
            size="lg"
            iconName="ArrowRight"
            iconPosition="right"
            onClick={onClose}
            className="w-full sm:w-auto"
          >
            Start Test Now
          </Button>
        </div>

        {isBreathing && (
          <div className="mt-8 p-6 bg-primary/5 rounded-lg border border-primary/10">
            <div className="flex flex-col items-center gap-4">
              <div className="w-24 h-24 md:w-32 md:h-32 rounded-full bg-primary/10 flex items-center justify-center animate-pulse">
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/20 flex items-center justify-center">
                  <Icon name="Wind" size={32} color="var(--color-primary)" />
                </div>
              </div>
              <div className="text-center">
                <p className="text-base md:text-lg font-medium text-foreground mb-2">
                  Breathe In... Hold... Breathe Out...
                </p>
                <p className="text-sm text-muted-foreground font-caption">
                  Follow the rhythm: 4 seconds in, 4 seconds hold, 4 seconds out
                </p>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ConfidenceBooster;
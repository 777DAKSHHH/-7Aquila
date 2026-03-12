import React, { useEffect, useState } from 'react';
import Icon from '../../../components/AppIcon';

const TestTimer = ({ 
  timeLeft = 60,
  totalTime = 60,
  isActive = false,
  label = 'Preparation Time',
  variant = 'preparation'
}) => {
  const [displayTime, setDisplayTime] = useState('00:00');
  const progressPercentage = (timeLeft / totalTime) * 100;
  const isWarning = timeLeft <= 10 && timeLeft > 0;
  const isExpired = timeLeft === 0;

  useEffect(() => {
    const minutes = Math.floor(timeLeft / 60);
    const seconds = timeLeft % 60;
    setDisplayTime(`${String(minutes)?.padStart(2, '0')}:${String(seconds)?.padStart(2, '0')}`);
  }, [timeLeft]);

  const getVariantStyles = () => {
    if (isExpired) {
      return {
        bg: 'bg-error/10',
        border: 'border-error/20',
        text: 'text-error',
        icon: 'var(--color-error)',
        progress: 'bg-error'
      };
    }
    if (isWarning) {
      return {
        bg: 'bg-warning/10',
        border: 'border-warning/20',
        text: 'text-warning',
        icon: 'var(--color-warning)',
        progress: 'bg-warning'
      };
    }
    if (variant === 'preparation') {
      return {
        bg: 'bg-accent/10',
        border: 'border-accent/20',
        text: 'text-accent',
        icon: 'var(--color-accent)',
        progress: 'bg-accent'
      };
    }
    return {
      bg: 'bg-primary/10',
      border: 'border-primary/20',
      text: 'text-primary',
      icon: 'var(--color-primary)',
      progress: 'bg-primary'
    };
  };

  const styles = getVariantStyles();

  return (
    <div className={`${styles?.bg} border ${styles?.border} rounded-lg p-6 md:p-8 transition-all duration-base ${isWarning ? 'animate-pulse' : ''}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full ${styles?.bg} flex items-center justify-center`}>
            <Icon 
              name={isExpired ? 'AlertCircle' : 'Clock'} 
              size={20} 
              color={styles?.icon} 
            />
          </div>
          <div>
            <h3 className="text-base md:text-lg font-heading font-semibold text-foreground">
              {label}
            </h3>
            {isActive && !isExpired && (
              <p className="text-xs md:text-sm text-muted-foreground font-caption">
                {variant === 'preparation' ? 'Make notes and organize your thoughts' : 'Speak clearly and naturally'}
              </p>
            )}
            {isExpired && (
              <p className="text-xs md:text-sm text-error font-caption font-medium">
                Time's up! {variant === 'preparation' ? 'Start speaking now' : 'Move to next question'}
              </p>
            )}
          </div>
        </div>
        <div className={`text-3xl md:text-4xl lg:text-5xl font-mono font-bold ${styles?.text}`}>
          {displayTime}
        </div>
      </div>
      <div className="relative w-full h-3 bg-muted rounded-full overflow-hidden">
        <div 
          className={`absolute top-0 left-0 h-full ${styles?.progress} transition-all duration-1000 ease-linear`}
          style={{ width: `${progressPercentage}%` }}
        />
      </div>
      {isActive && !isExpired && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <div className={`w-2 h-2 rounded-full ${styles?.progress} animate-pulse`} />
          <span className={`text-sm font-caption font-medium ${styles?.text}`}>
            Timer Active
          </span>
        </div>
      )}
    </div>
  );
};

export default TestTimer;
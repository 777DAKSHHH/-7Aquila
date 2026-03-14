import React, { useEffect, useState } from "react";
import Icon from '../../../components/AppIcon';

const messages = [
  "Analyzing pronunciation...",
  "Evaluating grammar accuracy...",
  "Checking lexical resource...",
  "Measuring fluency and coherence...",
  "Calculating IELTS band score...",
  "Generating personalized feedback..."
];

const AIEvaluationRunning = () => {
  const [seconds, setSeconds] = useState(90);
  const [messageIndex, setMessageIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prev => (prev > 0 ? prev - 1 : 0));
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    const messageTimer = setInterval(() => {
      setMessageIndex(prev => (prev + 1) % messages.length);
    }, 4000);

    return () => clearInterval(messageTimer);
  }, []);

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-background/95 backdrop-blur-sm p-4">
      <div className="bg-card rounded-lg shadow-2xl border border-border max-w-xl w-full p-8 md:p-10 lg:p-12 animate-scale-in text-center">

        <div className="flex flex-col items-center justify-center mb-6">
          <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4 animate-pulse">
            <Icon name="Cpu" size={32} color="var(--color-primary)" />
          </div>
          <h2 className="text-2xl md:text-3xl font-heading font-semibold text-foreground">
            AI Evaluation Running
          </h2>
        </div>

        <p className="text-lg text-muted-foreground mb-8">
          Your speaking performance is being analyzed.
        </p>

        <div className="mb-8">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm text-primary font-medium">{messages[messageIndex]}</span>
            <span className="text-sm font-mono font-medium text-foreground">{seconds}s</span>
          </div>
          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-1000 ease-linear"
              style={{ width: `${Math.max(5, 100 - (seconds / 90) * 100)}%` }}
            />
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIEvaluationRunning;
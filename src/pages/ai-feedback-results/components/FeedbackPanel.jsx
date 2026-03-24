import React from 'react';
import Icon from '../../../components/AppIcon';

const FeedbackPanel = ({ 
  feedback = {},
  strengths = [],
  improvements = []
}) => {
  const criteriaFeedback = [
    {
      key: 'fluency',
      title: 'Fluency & Coherence',
      icon: 'MessageCircle',
      color: 'text-blue-600',
      bgColor: 'bg-blue-50',
      content: feedback?.fluency || ''
    },
    {
      key: 'lexical',
      title: 'Lexical Resource',
      icon: 'BookOpen',
      color: 'text-purple-600',
      bgColor: 'bg-purple-50',
      content: feedback?.lexical || ''
    },
    {
      key: 'grammar',
      title: 'Grammar Range & Accuracy',
      icon: 'FileText',
      color: 'text-green-600',
      bgColor: 'bg-green-50',
      content: feedback?.grammar || ''
    },
    {
      key: 'pronunciation',
      title: 'Pronunciation',
      icon: 'Mic',
      color: 'text-orange-600',
      bgColor: 'bg-orange-50',
      content: feedback?.pronunciation || ''
    },
    {
      key: 'pacing',
      title: 'Pacing & Hesitation',
      icon: 'Clock',
      color: 'text-rose-600',
      bgColor: 'bg-rose-50',
      content: feedback?.pacing_and_hesitation || ''
    }
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border">
      <div className="mb-6 md:mb-8">
        <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-2">
          Detailed Feedback & Analysis
        </h3>
        <p className="text-sm md:text-base text-muted-foreground font-caption">
          AI-generated insights to help you improve your speaking performance
        </p>
      </div>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
        <div className="bg-success/10 rounded-lg p-4 md:p-5 border border-success/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-success/20 flex items-center justify-center">
              <Icon name="ThumbsUp" size={20} color="var(--color-success)" />
            </div>
            <h4 className="text-base md:text-lg font-heading font-semibold text-success">
              Your Strengths
            </h4>
          </div>
          <ul className="space-y-2">
            {strengths?.map((strength, index) => (
              <li key={index} className="flex items-start gap-2 text-sm md:text-base text-foreground">
                <Icon name="Check" size={16} color="var(--color-success)" className="mt-1 flex-shrink-0" />
                <span>{strength}</span>
              </li>
            ))}
          </ul>
        </div>

        <div className="bg-warning/10 rounded-lg p-4 md:p-5 border border-warning/20">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-10 h-10 rounded-full bg-warning/20 flex items-center justify-center">
              <Icon name="TrendingUp" size={20} color="var(--color-warning)" />
            </div>
            <h4 className="text-base md:text-lg font-heading font-semibold text-warning">
              Areas for Improvement
            </h4>
          </div>
          <ul className="space-y-2">
            {improvements?.map((improvement, index) => (
              <li key={index} className="flex items-start gap-2 text-sm md:text-base text-foreground">
                <Icon name="ArrowRight" size={16} color="var(--color-warning)" className="mt-1 flex-shrink-0" />
                <span>{improvement}</span>
              </li>
            ))}
          </ul>
        </div>
      </div>
      <div className="space-y-4 md:space-y-6">
        {criteriaFeedback?.map((criterion) => (
          <div key={criterion?.key} className={`${criterion?.bgColor} dark:bg-card rounded-lg p-4 md:p-5 border border-border`}>
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-full bg-background flex items-center justify-center ${criterion?.color}`}>
                <Icon name={criterion?.icon} size={20} />
              </div>
              <h5 className="text-base md:text-lg font-heading font-semibold text-foreground">
                {criterion?.title}
              </h5>
            </div>
            <p className="text-sm md:text-base text-foreground leading-relaxed">
              {criterion?.content}
            </p>
          </div>
        ))}
      </div>
      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border">
        <div className="flex items-start gap-3 bg-primary/10 rounded-lg p-4">
          <Icon name="Lightbulb" size={24} color="var(--color-primary)" className="flex-shrink-0 mt-1" />
          <div>
            <h5 className="text-base md:text-lg font-heading font-semibold text-primary mb-2">
              Quick Tip for Next Practice
            </h5>
            <p className="text-sm md:text-base text-foreground">
              Focus on reducing filler words by pausing briefly instead of saying "um" or "uh". Practice speaking slowly and deliberately to give yourself time to think about your next words.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default FeedbackPanel;
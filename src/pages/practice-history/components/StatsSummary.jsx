import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsSummary = ({ 
  totalAttempts = 0, 
  averageScore = 0, 
  improvementPercentage = 0,
  lastAttemptDate = '',
  averageFluency = 0,
  averageLexical = 0,
  averageGrammar = 0,
  averagePronunciation = 0,
  activeModule = 'speaking'
}) => {
  const stats = [
    {
      icon: 'FileText',
      label: 'Total Attempts',
      value: totalAttempts,
      color: 'var(--color-primary)',
      bgColor: 'bg-primary/10'
    },
    {
      icon: 'TrendingUp',
      label: 'Average Score',
      value: averageScore?.toFixed(1),
      color: 'var(--color-accent)',
      bgColor: 'bg-accent/10'
    },
    {
      icon: 'Award',
      label: 'Improvement',
      value: `${improvementPercentage > 0 ? '+' : ''}${improvementPercentage}%`,
      color: improvementPercentage >= 0 ? 'var(--color-success)' : 'var(--color-error)',
      bgColor: improvementPercentage >= 0 ? 'bg-success/10' : 'bg-error/10'
    },
    {
      icon: 'Calendar',
      label: 'Last Attempt',
      value: lastAttemptDate,
      color: 'var(--color-secondary)',
      bgColor: 'bg-secondary/10'
    }
  ];

  const isSpeaking = activeModule === 'speaking';

  return (
    <div className="space-y-4 md:space-y-6">
      {/* Main High-Level Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        {stats?.map((stat, index) => (
          <div 
            key={index}
            className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm hover:shadow-md transition-all duration-base"
          >
            <div className="flex items-start justify-between mb-3">
              <div className={`w-10 h-10 md:w-12 md:h-12 rounded-lg ${stat?.bgColor} flex items-center justify-center`}>
                <Icon name={stat?.icon} size={20} color={stat?.color} />
              </div>
            </div>
            <p className="text-xs md:text-sm text-muted-foreground font-caption mb-1">
              {stat?.label}
            </p>
            <p className="text-xl md:text-2xl font-heading font-bold text-foreground">
              {stat?.value}
            </p>
          </div>
        ))}
      </div>

      {/* Detailed Criteria Breakdown (Only for Speaking) */}
      {isSpeaking && totalAttempts > 0 && (
        <div className="bg-card rounded-lg p-4 md:p-6 border border-border shadow-sm">
          <h3 className="text-sm font-heading font-semibold text-foreground mb-4">Average Criteria Scores</h3>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 divide-x divide-border">
            <div className="pl-0">
              <p className="text-xs text-muted-foreground font-caption mb-1">Fluency & Coherence</p>
              <p className="text-lg font-heading font-bold text-foreground">{averageFluency?.toFixed(1)}</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground font-caption mb-1">Lexical Resource</p>
              <p className="text-lg font-heading font-bold text-foreground">{averageLexical?.toFixed(1)}</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground font-caption mb-1">Grammar</p>
              <p className="text-lg font-heading font-bold text-foreground">{averageGrammar?.toFixed(1)}</p>
            </div>
            <div className="pl-4">
              <p className="text-xs text-muted-foreground font-caption mb-1">Pronunciation</p>
              <p className="text-lg font-heading font-bold text-foreground">{averagePronunciation?.toFixed(1)}</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default StatsSummary;
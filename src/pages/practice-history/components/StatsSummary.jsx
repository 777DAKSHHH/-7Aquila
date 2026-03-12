import React from 'react';
import Icon from '../../../components/AppIcon';

const StatsSummary = ({ 
  totalAttempts = 0, 
  averageScore = 0, 
  improvementPercentage = 0,
  lastAttemptDate = ''
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

  return (
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
  );
};

export default StatsSummary;
import React from 'react';
import Icon from '../../../components/AppIcon';

const PerformanceMetrics = ({ metrics = {} }) => {
  const metricCards = [
    {
      id: 'totalStudents',
      label: 'Total Students',
      value: metrics?.totalStudents || 0,
      icon: 'Users',
      color: 'primary',
      bgColor: 'bg-primary/10',
    },
    {
      id: 'averageScore',
      label: 'Class Average Score',
      value: (metrics?.averageScore || 0)?.toFixed(1),
      icon: 'TrendingUp',
      color: 'success',
      bgColor: 'bg-success/10',
    },
    {
      id: 'totalAttempts',
      label: 'Total Attempts',
      value: metrics?.totalAttempts || 0,
      icon: 'FileAudio',
      color: 'accent',
      bgColor: 'bg-accent/10',
    },
    {
      id: 'improvementRate',
      label: 'Avg Improvement',
      value: `+${(metrics?.improvementRate || 0)?.toFixed(1)}%`,
      icon: 'ArrowUp',
      color: 'success',
      bgColor: 'bg-success/10',
    },
  ];

  return (
    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
      {metricCards?.map((metric) => (
        <div
          key={metric?.id}
          className="bg-card rounded-lg border border-border p-4 md:p-6 hover:shadow-md transition-all duration-base"
        >
          <div className="flex items-start justify-between mb-3">
            <div className={`w-12 h-12 rounded-lg ${metric?.bgColor} flex items-center justify-center`}>
              <Icon name={metric?.icon} size={24} color={`var(--color-${metric?.color})`} />
            </div>
          </div>
          <p className="text-sm text-muted-foreground font-caption mb-1">{metric?.label}</p>
          <p className="text-2xl md:text-3xl font-heading font-bold text-foreground mono">
            {metric?.value}
          </p>
        </div>
      ))}
    </div>
  );
};

export default PerformanceMetrics;
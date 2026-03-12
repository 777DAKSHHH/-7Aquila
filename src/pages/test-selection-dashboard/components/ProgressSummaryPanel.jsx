import React from 'react';
import Icon from '../../../components/AppIcon';

const ProgressSummaryPanel = ({ stats }) => {
  const { recentScore, totalTests, averageScore, improvementTrend, lastTestDate } = stats;

  const getTrendIcon = () => {
    if (improvementTrend > 0) return { name: 'TrendingUp', color: 'var(--color-success)' };
    if (improvementTrend < 0) return { name: 'TrendingDown', color: 'var(--color-error)' };
    return { name: 'Minus', color: 'var(--color-muted-foreground)' };
  };

  const trendIcon = getTrendIcon();

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex items-center justify-between mb-4 md:mb-6">
        <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
          Your Progress
        </h2>
        <div className="flex items-center gap-2 px-3 py-1.5 bg-primary/10 rounded-md">
          <Icon name="Award" size={18} color="var(--color-primary)" />
          <span className="text-sm md:text-base font-medium mono text-primary">
            Band {recentScore}
          </span>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6">
        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="Target" size={20} color="var(--color-primary)" />
            <span className="text-sm font-caption text-muted-foreground">Recent Score</span>
          </div>
          <p className="text-2xl md:text-3xl font-semibold mono text-foreground">{recentScore}</p>
          <p className="text-xs text-muted-foreground font-caption mt-1">{lastTestDate}</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="FileText" size={20} color="var(--color-primary)" />
            <span className="text-sm font-caption text-muted-foreground">Total Tests</span>
          </div>
          <p className="text-2xl md:text-3xl font-semibold mono text-foreground">{totalTests}</p>
          <p className="text-xs text-muted-foreground font-caption mt-1">Completed</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="BarChart3" size={20} color="var(--color-primary)" />
            <span className="text-sm font-caption text-muted-foreground">Average Score</span>
          </div>
          <p className="text-2xl md:text-3xl font-semibold mono text-foreground">{averageScore}</p>
          <p className="text-xs text-muted-foreground font-caption mt-1">Overall</p>
        </div>

        <div className="bg-muted/30 rounded-lg p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name={trendIcon?.name} size={20} color={trendIcon?.color} />
            <span className="text-sm font-caption text-muted-foreground">Improvement</span>
          </div>
          <p className="text-2xl md:text-3xl font-semibold mono text-foreground">
            {improvementTrend > 0 ? '+' : ''}{improvementTrend}
          </p>
          <p className="text-xs text-muted-foreground font-caption mt-1">Last 5 tests</p>
        </div>
      </div>
    </div>
  );
};

export default ProgressSummaryPanel;
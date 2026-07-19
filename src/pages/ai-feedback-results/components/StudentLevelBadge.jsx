import React from 'react';
import Icon from '../../../components/AppIcon';

const StudentLevelBadge = ({ level }) => {
  if (!level) return null;

  const levelConfig = {
    'Beginner': { color: 'text-error', bg: 'bg-error/10', border: 'border-error/20', icon: 'TrendingUp' },
    'Intermediate': { color: 'text-warning', bg: 'bg-warning/10', border: 'border-warning/20', icon: 'Award' },
    'Advanced': { color: 'text-success', bg: 'bg-success/10', border: 'border-success/20', icon: 'Star' }
  };

  // Fallback to primary color if level doesn't match perfectly
  const config = levelConfig[level] || { color: 'text-primary', bg: 'bg-primary/10', border: 'border-primary/20', icon: 'User' };

  return (
    <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border ${config.bg} ${config.border} ${config.color}`}>
      <Icon name={config.icon} size={16} />
      <span className="font-heading font-semibold text-sm">Estimated Level: {level}</span>
    </div>
  );
};

export default StudentLevelBadge;
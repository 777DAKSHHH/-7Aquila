import React from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const RecentActivityPanel = ({ activities = [] }) => {
  const getActivityIcon = (type) => {
    switch (type) {
      case 'new_attempt':
        return 'FileAudio';
      case 'feedback_pending':
        return 'MessageSquare';
      case 'improvement':
        return 'TrendingUp';
      default:
        return 'Activity';
    }
  };

  const getActivityColor = (type) => {
    switch (type) {
      case 'new_attempt':
        return 'primary';
      case 'feedback_pending':
        return 'warning';
      case 'improvement':
        return 'success';
      default:
        return 'muted';
    }
  };

  return (
    <div className="bg-card rounded-lg border border-border p-4 md:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-heading font-semibold text-foreground">Recent Activity</h3>
        <Link to="/student-audio-review">
          <Button variant="ghost" size="sm" iconName="ArrowRight" iconPosition="right">
            View All
          </Button>
        </Link>
      </div>
      <div className="space-y-3">
        {activities?.length === 0 ? (
          <div className="text-center py-8">
            <Icon name="Inbox" size={48} className="mx-auto mb-3 opacity-30" />
            <p className="text-muted-foreground font-caption">No recent activity</p>
          </div>
        ) : (
          activities?.map((activity) => (
            <div
              key={activity?.id}
              className="flex items-start gap-3 p-3 rounded-lg hover:bg-muted/30 transition-colors duration-base"
            >
              <div
                className={`w-10 h-10 rounded-lg bg-${getActivityColor(activity?.type)}/10 flex items-center justify-center flex-shrink-0`}
              >
                <Icon
                  name={getActivityIcon(activity?.type)}
                  size={20}
                  color={`var(--color-${getActivityColor(activity?.type)})`}
                />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground">{activity?.studentName}</p>
                <p className="text-sm text-muted-foreground font-caption">{activity?.description}</p>
                <p className="text-xs text-muted-foreground font-caption mt-1">{activity?.timestamp}</p>
              </div>
              {activity?.actionRequired && (
                <Button variant="outline" size="xs" iconName="ArrowRight">
                  Review
                </Button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default RecentActivityPanel;
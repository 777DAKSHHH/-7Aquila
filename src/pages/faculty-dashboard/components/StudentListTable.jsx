import React, { useState } from 'react';

import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StudentListTable = ({ students = [], onViewAttempts, onAddFeedback }) => {
  const [sortConfig, setSortConfig] = useState({ key: 'name', direction: 'asc' });

  const handleSort = (key) => {
    setSortConfig({
      key,
      direction: sortConfig?.key === key && sortConfig?.direction === 'asc' ? 'desc' : 'asc',
    });
  };

  const sortedStudents = [...students]?.sort((a, b) => {
    if (sortConfig?.key === 'name') {
      return sortConfig?.direction === 'asc'
        ? a?.name?.localeCompare(b?.name)
        : b?.name?.localeCompare(a?.name);
    }
    if (sortConfig?.key === 'lastAttempt') {
      return sortConfig?.direction === 'asc'
        ? new Date(a.lastAttempt) - new Date(b.lastAttempt)
        : new Date(b.lastAttempt) - new Date(a.lastAttempt);
    }
    if (sortConfig?.key === 'latestScore') {
      return sortConfig?.direction === 'asc'
        ? a?.latestScore - b?.latestScore
        : b?.latestScore - a?.latestScore;
    }
    if (sortConfig?.key === 'progress') {
      return sortConfig?.direction === 'asc'
        ? a?.progressPercentage - b?.progressPercentage
        : b?.progressPercentage - a?.progressPercentage;
    }
    return 0;
  });

  const getProgressColor = (percentage) => {
    if (percentage >= 75) return 'bg-success';
    if (percentage >= 50) return 'bg-warning';
    return 'bg-error';
  };

  const getScoreColor = (score) => {
    if (score >= 7.0) return 'text-success';
    if (score >= 6.0) return 'text-warning';
    return 'text-error';
  };

  const SortIcon = ({ columnKey }) => {
    if (sortConfig?.key !== columnKey) {
      return <Icon name="ChevronsUpDown" size={16} color="var(--color-muted-foreground)" />;
    }
    return sortConfig?.direction === 'asc' ? (
      <Icon name="ChevronUp" size={16} color="var(--color-primary)" />
    ) : (
      <Icon name="ChevronDown" size={16} color="var(--color-primary)" />
    );
  };

  return (
    <div className="bg-card rounded-lg border border-border overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground hover:text-primary transition-colors duration-base"
                >
                  Student Name
                  <SortIcon columnKey="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <span className="font-heading font-semibold text-sm text-foreground">
                  Student ID
                </span>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('lastAttempt')}
                  className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground hover:text-primary transition-colors duration-base"
                >
                  Last Attempt
                  <SortIcon columnKey="lastAttempt" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('latestScore')}
                  className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground hover:text-primary transition-colors duration-base"
                >
                  Latest Score
                  <SortIcon columnKey="latestScore" />
                </button>
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('progress')}
                  className="flex items-center gap-2 font-heading font-semibold text-sm text-foreground hover:text-primary transition-colors duration-base"
                >
                  Progress
                  <SortIcon columnKey="progress" />
                </button>
              </th>
              <th className="px-4 py-3 text-right">
                <span className="font-heading font-semibold text-sm text-foreground">Actions</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStudents?.map((student) => (
              <tr key={student?.id} className="hover:bg-muted/30 transition-colors duration-base">
                <td className="px-4 py-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={20} color="var(--color-primary)" />
                    </div>
                    <div>
                      <p className="font-medium text-foreground">{student?.name}</p>
                      <p className="text-sm text-muted-foreground font-caption">{student?.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm font-mono text-foreground">{student?.studentId}</span>
                </td>
                <td className="px-4 py-4">
                  <span className="text-sm text-foreground">{student?.lastAttempt}</span>
                </td>
                <td className="px-4 py-4">
                  <span className={`text-lg font-semibold mono ${getScoreColor(student?.latestScore)}`}>
                    {student?.latestScore?.toFixed(1)}
                  </span>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden max-w-[120px]">
                      <div
                        className={`h-full ${getProgressColor(student?.progressPercentage)} transition-all duration-500`}
                        style={{ width: `${student?.progressPercentage}%` }}
                      />
                    </div>
                    <span className="text-sm font-medium mono text-foreground min-w-[45px]">
                      {student?.progressPercentage}%
                    </span>
                  </div>
                </td>
                <td className="px-4 py-4">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      iconName="Eye"
                      iconPosition="left"
                      onClick={() => onViewAttempts(student?.id)}
                    >
                      View
                    </Button>
                    <Button
                      variant="default"
                      size="sm"
                      iconName="MessageSquare"
                      iconPosition="left"
                      onClick={() => onAddFeedback(student?.id)}
                    >
                      Feedback
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default StudentListTable;
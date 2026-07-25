import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const StudentListTable = ({ 
  students = [], 
  onViewAttempts, 
  onAddFeedback, 
  activeModule = 'speaking',
  onViewProfile 
}) => {
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
        <table className="w-full text-xs">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('name')}
                  className="flex items-center gap-2 font-heading font-semibold text-[11px] text-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Student Name
                  <SortIcon columnKey="name" />
                </button>
              </th>
              <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Student ID
              </th>
              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('lastAttempt')}
                  className="flex items-center gap-2 font-heading font-semibold text-[11px] text-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Last Attempt
                  <SortIcon columnKey="lastAttempt" />
                </button>
              </th>
              
              {/* Dynamic Table Headers based on Module */}
              {activeModule === 'speaking' && (
                <>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Fluency</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Lexical</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Grammar</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Pronunciation</th>
                </>
              )}

              {activeModule === 'writing' && (
                <>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Task 1</th>
                  <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Task 2</th>
                </>
              )}

              {(activeModule === 'reading' || activeModule === 'listening') && (
                <th className="px-4 py-3 text-left font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">Raw Score</th>
              )}

              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('latestScore')}
                  className="flex items-center gap-2 font-heading font-semibold text-[11px] text-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Overall
                  <SortIcon columnKey="latestScore" />
                </button>
              </th>

              <th className="px-4 py-3 text-left">
                <button
                  onClick={() => handleSort('progress')}
                  className="flex items-center gap-2 font-heading font-semibold text-[11px] text-foreground hover:text-primary transition-colors uppercase tracking-wider"
                >
                  Progress
                  <SortIcon columnKey="progress" />
                </button>
              </th>
              <th className="px-4 py-3 text-right font-heading font-semibold text-[11px] uppercase tracking-wider text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {sortedStudents?.map((student) => (
              <tr key={student?.id} className="hover:bg-muted/30 transition-colors">
                
                {/* Name & profile trigger */}
                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                      <Icon name="User" size={16} className="text-primary" />
                    </div>
                    <div>
                      <button
                        type="button"
                        onClick={() => onViewProfile?.(student.id)}
                        className="font-semibold text-foreground hover:text-primary transition-colors text-left font-heading block hover:underline"
                      >
                        {student?.name}
                      </button>
                      <p className="text-[10px] text-muted-foreground font-caption">{student?.email}</p>
                    </div>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <span className="font-mono text-foreground font-medium">{student?.studentId}</span>
                </td>

                <td className="px-4 py-3.5">
                  <span className="text-foreground">{student?.lastAttempt}</span>
                </td>

                {/* Dynamic Table Cells */}
                {activeModule === 'speaking' && (
                  <>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">{student.fluency?.toFixed(1)}</td>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">{student.lexical?.toFixed(1)}</td>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">{student.grammar?.toFixed(1)}</td>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">{student.pronunciation?.toFixed(1)}</td>
                  </>
                )}

                {activeModule === 'writing' && (
                  <>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                      {student.task1Band > 0 ? student.task1Band.toFixed(1) : "N/A"}
                    </td>
                    <td className="px-4 py-3.5 font-mono font-medium text-foreground">
                      {student.task2Band > 0 ? student.task2Band.toFixed(1) : "N/A"}
                    </td>
                  </>
                )}

                {(activeModule === 'reading' || activeModule === 'listening') && (
                  <td className="px-4 py-3.5 font-mono font-medium text-foreground">{student.raw_score}</td>
                )}

                <td className="px-4 py-3.5">
                  <span className={`text-sm font-bold font-mono ${getScoreColor(student?.latestScore)}`}>
                    {student?.latestScore > 0 ? student?.latestScore?.toFixed(1) : "0.0"}
                  </span>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-1.5 bg-muted rounded-full overflow-hidden max-w-[80px]">
                      <div
                        className={`h-full ${getProgressColor(student?.progressPercentage)} transition-all duration-500`}
                        style={{ width: `${student?.progressPercentage}%` }}
                      />
                    </div>
                    <span className="font-mono text-muted-foreground text-[10px]">
                      {student?.progressPercentage}%
                    </span>
                  </div>
                </td>

                <td className="px-4 py-3.5">
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      variant="outline"
                      size="xs"
                      iconName="Eye"
                      iconPosition="left"
                      onClick={() => onViewAttempts(student?.id)}
                      className="h-7 text-[10px] font-bold px-2.5"
                    >
                      Review
                    </Button>
                    {(activeModule === 'speaking' || activeModule === 'writing') && (
                      <Button
                        variant="default"
                        size="xs"
                        iconName="MessageSquare"
                        iconPosition="left"
                        onClick={() => onAddFeedback(student?.id)}
                        className="h-7 text-[10px] font-bold px-2.5"
                      >
                        Grade
                      </Button>
                    )}
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
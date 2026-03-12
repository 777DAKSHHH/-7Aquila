import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';


const AttemptsTable = ({ attempts = [], onSort = () => {} }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [playingId, setPlayingId] = useState(null);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field, newDirection);
  };

  const handlePlayAudio = (id) => {
    setPlayingId(playingId === id ? null : id);
    // Audio playback logic would go here
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-error';
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <Icon name="ChevronsUpDown" size={14} />;
    return <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />;
  };

  return (
    <div className="bg-card rounded-lg border border-border shadow-sm overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead className="bg-muted/50 border-b border-border">
            <tr>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('date')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Date
                  <SortIcon field="date" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('topic')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Topic
                  <SortIcon field="topic" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('overallScore')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Overall
                  <SortIcon field="overallScore" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Fluency
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Lexical
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Grammar
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Pronunciation
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts?.length === 0 ? (
              <tr>
                <td colSpan="8" className="p-8 text-center">
                  <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground font-caption">No practice attempts found</p>
                </td>
              </tr>
            ) : (
              attempts?.map((attempt) => (
                <tr
                  key={attempt?.id}
                  className="border-b border-border hover:bg-muted/30 transition-colors duration-base"
                >
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{attempt?.date}</span>
                      <span className="text-xs text-muted-foreground font-caption">
                        {attempt?.duration}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="flex flex-col">
                      <span className="text-sm font-medium text-foreground">{attempt?.topic}</span>
                      <span className="text-xs text-muted-foreground font-caption">
                        {attempt?.topicType}
                      </span>
                    </div>
                  </td>
                  <td className="p-4">
                    <span className={`text-lg font-heading font-bold ${getScoreColor(attempt?.overallScore)}`}>
                      {attempt?.overallScore}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.fluency)}`}>
                      {attempt?.fluency}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.lexical)}`}>
                      {attempt?.lexical}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.grammar)}`}>
                      {attempt?.grammar}
                    </span>
                  </td>
                  <td className="p-4">
                    <span className={`text-sm font-semibold ${getScoreColor(attempt?.pronunciation)}`}>
                      {attempt?.pronunciation}
                    </span>
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handlePlayAudio(attempt?.id)}
                        className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                        aria-label={playingId === attempt?.id ? 'Pause audio' : 'Play audio'}
                      >
                        <Icon
                          name={playingId === attempt?.id ? 'Pause' : 'Play'}
                          size={16}
                          color="var(--color-primary)"
                        />
                      </button>
                      <Link to={`/ai-feedback-results?attemptId=${attempt?.id}`}>
                        <button
                          className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                          aria-label="View details"
                        >
                          <Icon name="Eye" size={16} color="var(--color-primary)" />
                        </button>
                      </Link>
                      <button
                        className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                        aria-label="Download recording"
                      >
                        <Icon name="Download" size={16} color="var(--color-primary)" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttemptsTable;
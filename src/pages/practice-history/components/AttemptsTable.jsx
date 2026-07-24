import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import { downloadAttemptZip } from '../../../utils/downloadUtils.js';
import { getAttemptScores } from '../../../utils/scoreUtils.js';

const AttemptsTable = ({ attempts = [], activeModule = 'speaking', onSort = () => {} }) => {
  const [sortField, setSortField] = useState('date');
  const [sortDirection, setSortDirection] = useState('desc');
  const [playingId, setPlayingId] = useState(null);
  const [downloadingId, setDownloadingId] = useState(null);

  const handleSort = (field) => {
    const newDirection = sortField === field && sortDirection === 'asc' ? 'desc' : 'asc';
    setSortField(field);
    setSortDirection(newDirection);
    onSort(field, newDirection);
  };

  const handlePlayAudio = (id) => {
    setPlayingId(playingId === id ? null : id);
  };

  const getScoreColor = (score) => {
    const val = parseFloat(score);
    if (isNaN(val)) return 'text-muted-foreground';
    if (val >= 7) return 'text-success';
    if (val >= 5) return 'text-warning';
    return 'text-error';
  };

  const handleDownloadZip = async (attempt) => {
    try {
      setDownloadingId(attempt?.id);
      await downloadAttemptZip(attempt);
    } catch (err) {
      console.error("Error downloading zip:", err);
      alert("Failed to download recordings. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const SortIcon = ({ field }) => {
    if (sortField !== field) return <Icon name="ChevronsUpDown" size={14} />;
    return <Icon name={sortDirection === 'asc' ? 'ChevronUp' : 'ChevronDown'} size={14} />;
  };

  const isSpeaking = activeModule === 'speaking';
  const isWriting = activeModule === 'writing';

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
                  {isSpeaking ? 'Topic' : 'Test Name'}
                  <SortIcon field="topic" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('topicType')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Category / Task
                  <SortIcon field="topicType" />
                </button>
              </th>
              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                <button
                  onClick={() => handleSort('difficulty')}
                  className="flex items-center gap-2 hover:text-primary transition-colors duration-base"
                >
                  Difficulty
                  <SortIcon field="difficulty" />
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

              {/* Dynamic Headers */}
              {isSpeaking && (
                <>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Fluency</th>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Lexical</th>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Grammar</th>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Pronunciation</th>
                </>
              )}

              {isWriting && (
                <>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Task 1 Band</th>
                  <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Task 2 Band</th>
                </>
              )}

              {!isSpeaking && !isWriting && (
                <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">Correct Qs</th>
              )}

              <th className="text-left p-4 text-sm font-heading font-semibold text-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {attempts?.length === 0 ? (
              <tr>
                <td colSpan={isSpeaking ? 10 : isWriting ? 8 : 7} className="p-8 text-center">
                  <Icon name="FileText" size={48} className="mx-auto mb-3 opacity-30" />
                  <p className="text-muted-foreground font-caption">No practice attempts found</p>
                </td>
              </tr>
            ) : (
              attempts?.map((attempt) => {
                const scores = isSpeaking ? getAttemptScores(attempt) : {
                  overall: attempt.overallScore,
                  isReviewed: attempt.status === 'reviewed',
                };
                
                return (
                  <tr
                    key={attempt?.id}
                    className={`border-b border-border hover:bg-muted/30 transition-colors duration-base ${scores.isReviewed ? 'bg-primary/5' : ''}`}
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
                      <div className="flex flex-col gap-1">
                        <span className="text-sm font-medium text-foreground max-w-[200px] line-clamp-2" title={attempt?.topic}>
                          {attempt?.topic || '-'}
                        </span>
                        {isSpeaking && (
                          <div className={`flex items-center gap-1.5 text-xs font-medium px-2 py-0.5 rounded-full w-fit ${
                            scores.isReviewed ? 'text-primary bg-primary/10' : 'text-muted-foreground bg-muted'
                          }`}>
                            <Icon name={scores.isReviewed ? "UserCheck" : "Brain"} size={12} />
                            <span>{scores.isReviewed ? "Faculty Reviewed" : "AI Evaluated"}</span>
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-muted text-muted-foreground capitalize">
                        {attempt?.topicType || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2 py-0.5 rounded text-xs font-medium capitalize ${
                        attempt?.difficulty?.toLowerCase() === 'hard' ? 'bg-error/10 text-error' :
                        attempt?.difficulty?.toLowerCase() === 'medium' ? 'bg-warning/10 text-warning' :
                        attempt?.difficulty?.toLowerCase() === 'easy' ? 'bg-success/10 text-success' :
                        'bg-muted text-muted-foreground'
                      }`}>
                        {attempt?.difficulty || '-'}
                      </span>
                    </td>
                    <td className="p-4">
                      <div className="flex flex-col items-start">
                        {isSpeaking && <span className="text-[10px] font-caption text-muted-foreground">{scores.isReviewed ? 'Official' : 'AI'}</span>}
                        <span className={`text-lg font-heading font-bold ${getScoreColor(scores.overall)}`}>
                          {scores.overall || 'N/A'}
                        </span>
                      </div>
                    </td>

                    {/* Dynamic Cells */}
                    {isSpeaking && (
                      <>
                        <td className="p-4">
                          <span className={`text-sm font-semibold ${getScoreColor(scores.fluency)}`}>
                            {scores.fluency}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-semibold ${getScoreColor(scores.lexical)}`}>
                            {scores.lexical}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-semibold ${getScoreColor(scores.grammar)}`}>
                            {scores.grammar}
                          </span>
                        </td>
                        <td className="p-4">
                          <span className={`text-sm font-semibold ${getScoreColor(scores.pronunciation)}`}>
                            {scores.pronunciation}
                          </span>
                        </td>
                      </>
                    )}

                    {isWriting && (
                      <>
                        <td className="p-4">
                          <span className="text-sm font-semibold">{attempt.task1Band || 'N/A'}</span>
                        </td>
                        <td className="p-4">
                          <span className="text-sm font-semibold">{attempt.task2Band || 'N/A'}</span>
                        </td>
                      </>
                    )}

                    {!isSpeaking && !isWriting && (
                      <td className="p-4">
                        <span className="text-sm font-semibold font-mono text-muted-foreground">
                          {attempt.correctAnswers || '-'}
                        </span>
                      </td>
                    )}

                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        {isSpeaking && (
                          <>
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
                            <button
                              onClick={() => handleDownloadZip(attempt)}
                              disabled={downloadingId === attempt?.id}
                              className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring"
                              aria-label="Download recording"
                            >
                              {downloadingId === attempt?.id ? (
                                <Icon name="Loader" size={16} className="animate-spin text-primary" />
                              ) : (
                                <Icon name="Download" size={16} color="var(--color-primary)" />
                              )}
                            </button>
                          </>
                        )}
                        
                        {isSpeaking ? (
                          <Link to={`/ai-feedback-results/${attempt?.id}`}>
                            <button className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring" aria-label="View details">
                              <Icon name="Eye" size={16} color="var(--color-primary)" />
                            </button>
                          </Link>
                        ) : isWriting ? (
                          // For writing, if evaluated, it went to writing results page!
                          <Link to={`/assessment/writing/task1?session=${attempt.id}`}>
                            <button className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring" aria-label="View writing test details">
                              <Icon name="Eye" size={16} color="var(--color-primary)" />
                            </button>
                          </Link>
                        ) : (
                          // For reading / listening, it redirects to their test sessions
                          <Link to={`/assessment/${activeModule}/test/${attempt.id}`}>
                            <button className="p-2 rounded-md hover:bg-muted transition-colors duration-base focus-ring" aria-label="View test details">
                              <Icon name="Eye" size={16} color="var(--color-primary)" />
                            </button>
                          </Link>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default AttemptsTable;
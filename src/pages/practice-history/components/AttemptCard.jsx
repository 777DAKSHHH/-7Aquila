import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { downloadAttemptZip } from '../../../utils/downloadUtils.js';
import { getAttemptScores } from '../../../utils/scoreUtils.js';

const AttemptCard = ({ attempt, activeModule = 'speaking' }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
  };

  const getScoreColor = (score) => {
    const val = parseFloat(score);
    if (isNaN(val)) return 'text-muted-foreground';
    if (val >= 7) return 'text-success';
    if (val >= 5) return 'text-warning';
    return 'text-error';
  };

  const getScoreBgColor = (score) => {
    const val = parseFloat(score);
    if (isNaN(val)) return 'bg-muted';
    if (val >= 7) return 'bg-success/10';
    if (val >= 5) return 'bg-warning/10';
    return 'bg-error/10';
  };

  const handleDownloadZip = async () => {
    try {
      setIsDownloading(true);
      await downloadAttemptZip(attempt);
    } catch (err) {
      console.error("Error downloading zip:", err);
      alert("Failed to download recordings. Please try again.");
    } finally {
      setIsDownloading(false);
    }
  };

  const isSpeaking = activeModule === 'speaking';
  const isWriting = activeModule === 'writing';

  const scores = isSpeaking ? getAttemptScores(attempt) : {
    overall: attempt.overallScore,
    isReviewed: attempt.status === 'reviewed',
  };

  return (
    <div className={`bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-base overflow-hidden ${scores.isReviewed ? 'bg-primary/5' : ''}`}>
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <h4 className="text-base md:text-lg font-heading font-semibold text-foreground">
                {attempt?.topic}
              </h4>
              
              <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2.5 py-1 rounded-full w-fit">
                <Icon name={isSpeaking ? (scores.isReviewed ? "UserCheck" : "Brain") : "Award"} size={13} />
                <span>
                  {isSpeaking 
                    ? (scores.isReviewed ? "Faculty Reviewed" : "AI Evaluated") 
                    : (isWriting ? "AI Evaluated" : "Auto Graded")
                  }
                </span>
              </div>
            </div>
            
            <div className="flex flex-wrap items-center gap-2 mt-2 text-xs md:text-sm text-muted-foreground font-caption">
              <div className="flex items-center gap-1">
                <Icon name="Calendar" size={14} />
                <span>{attempt?.date}</span>
              </div>
              <span>•</span>
              <div className="flex items-center gap-1">
                <Icon name="Clock" size={14} />
                <span>{attempt?.duration}</span>
              </div>
              <span>•</span>
              <span className="px-2 py-0.5 bg-muted rounded text-[11px] font-semibold">
                {attempt?.topicType}
              </span>
              {attempt?.difficulty && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded text-[11px] font-semibold capitalize ${
                    attempt?.difficulty?.toLowerCase() === 'hard' ? 'bg-error/10 text-error' :
                    attempt?.difficulty?.toLowerCase() === 'medium' ? 'bg-warning/10 text-warning' :
                    attempt?.difficulty?.toLowerCase() === 'easy' ? 'bg-success/10 text-success' :
                    'bg-muted text-muted-foreground'
                  }`}>
                    {attempt?.difficulty}
                  </span>
                </>
              )}
            </div>
          </div>
          
          <div className={`flex flex-col items-center justify-center w-16 h-16 md:w-20 md:h-20 rounded-lg ${getScoreBgColor(scores.overall)}`}>
            <span className={`text-2xl md:text-3xl font-heading font-bold ${getScoreColor(scores.overall)}`}>
              {scores.overall || 'N/A'}
            </span>
            <span className="text-[10px] text-muted-foreground font-caption uppercase tracking-wider font-semibold">
              {isSpeaking && scores.isReviewed ? "Official" : "Band"}
            </span>
          </div>
        </div>

        {/* Dynamic Criteria Blocks */}
        {isSpeaking && (
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
            {[
              { label: 'Fluency', score: scores.fluency, icon: 'MessageSquare' },
              { label: 'Lexical', score: scores.lexical, icon: 'BookOpen' },
              { label: 'Grammar', score: scores.grammar, icon: 'FileText' },
              { label: 'Pronunciation', score: scores.pronunciation, icon: 'Mic' }
            ]?.map((criteria, index) => (
              <div key={index} className="bg-muted/50 rounded-md p-2 md:p-3">
                <div className="flex items-center gap-1 mb-1">
                  <Icon name={criteria?.icon} size={14} color="var(--color-primary)" />
                  <span className="text-xs text-muted-foreground font-caption">
                    {criteria?.label}
                  </span>
                </div>
                <p className={`text-lg md:text-xl font-heading font-bold ${getScoreColor(criteria?.score)}`}>
                  {criteria?.score}
                </p>
              </div>
            ))}
          </div>
        )}

        {isWriting && (
          <div className="grid grid-cols-2 gap-3 mb-4">
            <div className="bg-muted/50 rounded-md p-2 md:p-3">
              <span className="text-xs text-muted-foreground font-caption block mb-1">Task 1 Report Score</span>
              <p className="text-lg md:text-xl font-heading font-bold text-primary">{attempt.task1Band || 'N/A'}</p>
            </div>
            <div className="bg-muted/50 rounded-md p-2 md:p-3">
              <span className="text-xs text-muted-foreground font-caption block mb-1">Task 2 Essay Score</span>
              <p className="text-lg md:text-xl font-heading font-bold text-primary">{attempt.task2Band || 'N/A'}</p>
            </div>
          </div>
        )}

        {!isSpeaking && !isWriting && (
          <div className="bg-muted/30 border border-border/50 rounded-xl p-3 mb-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground font-caption">Correct Answers Score:</span>
            <span className="font-bold font-mono text-foreground">{attempt.correctAnswers || '-'}</span>
          </div>
        )}

        {isSpeaking && isExpanded && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md animate-in fade-in duration-300">
            <p className="text-sm text-foreground mb-2">
              <span className="font-semibold">Key Strengths:</span> {attempt?.strengths}
            </p>
            <p className="text-sm text-foreground">
              <span className="font-semibold">Areas to Improve:</span> {attempt?.improvements}
            </p>
          </div>
        )}

        {isWriting && isExpanded && attempt.aiFeedback && (
          <div className="mb-4 p-4 bg-muted/30 rounded-md text-sm text-foreground leading-relaxed animate-in fade-in duration-300 space-y-2">
            <p className="font-semibold">AI Feedback Summary:</p>
            <p className="text-muted-foreground">{attempt.aiFeedback}</p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          {isSpeaking && (
            <>
              <Button
                variant="outline"
                size="sm"
                iconName={isPlaying ? 'Pause' : 'Play'}
                iconPosition="left"
                onClick={handlePlayAudio}
              >
                {isPlaying ? 'Pause' : 'Play'} Audio
              </Button>

              <Button 
                variant="ghost" 
                size="sm" 
                iconName={isDownloading ? 'Loader' : 'Download'} 
                iconPosition="left"
                onClick={handleDownloadZip}
                disabled={isDownloading}
              >
                {isDownloading ? 'Downloading...' : 'Download'}
              </Button>
            </>
          )}

          {isSpeaking ? (
            <Link to={`/ai-feedback-results/${attempt?.id}`}>
              <Button variant="default" size="sm" iconName="Eye" iconPosition="left">
                View Details
              </Button>
            </Link>
          ) : isWriting ? (
            <Link to={`/assessment/writing/task1?session=${attempt.id}`}>
              <Button variant="default" size="sm" iconName="Eye" iconPosition="left">
                Review Report
              </Button>
            </Link>
          ) : (
            <Link to={`/assessment/${activeModule}/test/${attempt.id}`}>
              <Button variant="default" size="sm" iconName="Eye" iconPosition="left">
                Review Test Answers
              </Button>
            </Link>
          )}

          {(isSpeaking || (isWriting && attempt.aiFeedback)) && (
            <Button
              variant="ghost"
              size="sm"
              iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
              iconPosition="left"
              onClick={() => setIsExpanded(!isExpanded)}
            >
              {isExpanded ? 'Less' : 'More'} Feedback
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};

export default AttemptCard;
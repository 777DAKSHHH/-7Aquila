import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import { downloadAttemptZip } from '../../../utils/downloadUtils.js';
import { getAttemptScores } from '../../../utils/scoreUtils.js';

const AttemptCard = ({ attempt }) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);

  const handlePlayAudio = () => {
    setIsPlaying(!isPlaying);
    // Audio playback logic would go here
  };

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5) return 'text-warning';
    return 'text-error';
  };


  const getScoreBgColor = (score) => {
    if (score >= 7) return 'bg-success/10';
    if (score >= 5) return 'bg-warning/10';
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

  const scores = getAttemptScores(attempt);

  return (
    <div className={`bg-card rounded-lg border border-border shadow-sm hover:shadow-md transition-all duration-base overflow-hidden ${scores.isReviewed ? 'bg-primary/5' : ''}`}>
      <div className="p-4 md:p-6">
        <div className="flex items-start justify-between mb-4">
          <div className="flex-1">
            <div className="flex flex-col gap-2">
              <h4 className="text-base md:text-lg font-heading font-semibold text-foreground">
                {attempt?.topic}
              </h4>
              {scores.isReviewed ? (
                <div className="flex items-center gap-1.5 text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded-full w-fit">
                  <Icon name="UserCheck" size={14} />
                  <span>Faculty Reviewed</span>
                </div>
              ) : (
                <div className="flex items-center gap-1.5 text-xs font-medium text-muted-foreground bg-muted px-2 py-1 rounded-full w-fit">
                  <Icon name="Brain" size={14} />
                  <span>AI Evaluated</span>
                </div>
              )
              
              }
            </div>
            <div className="flex flex-wrap items-center gap-2 text-xs md:text-sm text-muted-foreground font-caption">
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
              <span className="px-2 py-0.5 bg-muted rounded text-xs">
                {attempt?.topicType}
              </span>
              {attempt?.difficulty && (
                <>
                  <span>•</span>
                  <span className={`px-2 py-0.5 rounded text-xs font-medium capitalize ${
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
              {scores.overall}
            </span>
            <span className="text-xs text-muted-foreground font-caption">
              {scores.isReviewed ? "Official" : "AI Band"}
            </span>
          </div>
        </div>

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

        {isExpanded && (
          <div className="mb-4 p-3 bg-muted/30 rounded-md">
            <p className="text-sm text-foreground mb-2">
              <span className="font-medium">Key Strengths:</span> {attempt?.strengths}
            </p>
            <p className="text-sm text-foreground">
              <span className="font-medium">Areas to Improve:</span> {attempt?.improvements}
            </p>
          </div>
        )}

        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            iconName={isPlaying ? 'Pause' : 'Play'}
            iconPosition="left"
            onClick={handlePlayAudio}
          >
            {isPlaying ? 'Pause' : 'Play'} Audio
          </Button>

          <Link to={`/ai-feedback-results/${attempt?.id}`}>
            <Button variant="default" size="sm" iconName="Eye" iconPosition="left">
              View Details
            </Button>
          </Link>

          <Button
            variant="ghost"
            size="sm"
            iconName={isExpanded ? 'ChevronUp' : 'ChevronDown'}
            iconPosition="left"
            onClick={() => setIsExpanded(!isExpanded)}
          >
            {isExpanded ? 'Less' : 'More'}
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
        </div>
      </div>
    </div>
  );
};

export default AttemptCard;
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const TranscriptViewer = ({ transcript, highlights }) => {
  const [showHighlights, setShowHighlights] = useState(true);
  const [selectedHighlightType, setSelectedHighlightType] = useState('all');

  const highlightTypes = [
    { value: 'all', label: 'All Issues', icon: 'Eye', color: 'primary' },
    { value: 'filler', label: 'Filler Words', icon: 'MessageCircle', color: 'warning' },
    { value: 'pause', label: 'Long Pauses', icon: 'Clock', color: 'error' },
    { value: 'repetition', label: 'Repetitions', icon: 'Repeat', color: 'accent' },
    { value: 'pronunciation', label: 'Pronunciation', icon: 'Volume2', color: 'secondary' },
  ];

  const renderTranscriptWithHighlights = () => {
    if (!showHighlights) {
      return <p className="text-base md:text-lg leading-relaxed text-foreground">{transcript}</p>;
    }

    let highlightedText = transcript;
    const filteredHighlights =
      selectedHighlightType === 'all'
        ? highlights
        : highlights?.filter((h) => h?.type === selectedHighlightType);

    filteredHighlights?.forEach((highlight) => {
      const colorClass =
        highlight?.type === 'filler' ?'bg-warning/20 text-warning-foreground'
          : highlight?.type === 'pause' ?'bg-error/20 text-error-foreground'
          : highlight?.type === 'repetition' ?'bg-accent/20 text-accent-foreground' :'bg-secondary/20 text-secondary-foreground';

      highlightedText = highlightedText?.replace(
        highlight?.text,
        `<mark class="${colorClass} px-1 rounded">${highlight?.text}</mark>`
      );
    });

    return (
      <div
        className="text-base md:text-lg leading-relaxed text-foreground"
        dangerouslySetInnerHTML={{ __html: highlightedText }}
      />
    );
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-4 md:mb-6">
        <div className="flex items-center gap-3">
          <Icon name="FileText" size={24} color="var(--color-primary)" />
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Speech Transcript
          </h3>
        </div>

        <Button
          variant={showHighlights ? 'default' : 'outline'}
          size="sm"
          iconName={showHighlights ? 'EyeOff' : 'Eye'}
          iconPosition="left"
          onClick={() => setShowHighlights(!showHighlights)}
        >
          {showHighlights ? 'Hide' : 'Show'} Highlights
        </Button>
      </div>
      {showHighlights && (
        <div className="mb-4 md:mb-6 pb-4 border-b border-border">
          <div className="flex flex-wrap gap-2">
            {highlightTypes?.map((type) => (
              <button
                key={type?.value}
                onClick={() => setSelectedHighlightType(type?.value)}
                className={`flex items-center gap-2 px-3 py-1.5 rounded-md text-sm font-caption transition-all duration-base ${
                  selectedHighlightType === type?.value
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                }`}
              >
                <Icon name={type?.icon} size={14} />
                <span>{type?.label}</span>
              </button>
            ))}
          </div>
        </div>
      )}
      <div className="bg-muted/30 rounded-md p-4 md:p-6 max-h-[400px] md:max-h-[500px] overflow-y-auto">
        {renderTranscriptWithHighlights()}
      </div>
      {showHighlights && (
        <div className="mt-4 pt-4 border-t border-border">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-warning" />
              <span className="text-xs md:text-sm font-caption text-muted-foreground">
                Filler Words: {highlights?.filter((h) => h?.type === 'filler')?.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-error" />
              <span className="text-xs md:text-sm font-caption text-muted-foreground">
                Long Pauses: {highlights?.filter((h) => h?.type === 'pause')?.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-accent" />
              <span className="text-xs md:text-sm font-caption text-muted-foreground">
                Repetitions: {highlights?.filter((h) => h?.type === 'repetition')?.length}
              </span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full bg-secondary" />
              <span className="text-xs md:text-sm font-caption text-muted-foreground">
                Pronunciation: {highlights?.filter((h) => h?.type === 'pronunciation')?.length}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TranscriptViewer;
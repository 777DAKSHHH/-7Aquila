import React from 'react';
import Icon from '../../../components/AppIcon';

const ResponseAudioTranscript = ({ response, currentTime = 0, onWordClick }) => {

  return (
    <div className="space-y-4">
      <div>
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
          {response.part ? `Part ${response.part}` : 'Question'}
        </span>
        <p className="font-medium text-foreground text-lg">
          {response.question_text || "Question text not available"}
        </p>
      </div>
      
      {response.word_timestamps && response.word_timestamps.length > 0 ? (
        <div className="bg-muted/10 p-4 rounded-md border border-border/50">
          <p className="text-muted-foreground leading-relaxed">
            {response.word_timestamps.map((segment, idx) => {
              const isActive = currentTime >= segment.start && currentTime <= segment.end;
              return (
                <span 
                  key={idx}
                  onClick={() => onWordClick && onWordClick(segment.start)}
                  className={`cursor-pointer transition-colors duration-150 ${isActive ? 'bg-primary/20 text-primary font-medium rounded px-1' : 'hover:text-foreground'}`}
                >
                  {(segment.word || segment.text).trim()}{' '}
                </span>
              );
            })}
          </p>
        </div>
      ) : response.transcript ? (
        <div className="bg-muted/10 p-4 rounded-md border border-border/50">
          <p className="text-muted-foreground leading-relaxed">{response.transcript}</p>
        </div>
      ) : (
        <div className="text-sm text-muted-foreground italic flex items-center gap-2">
           <span>No transcript available for this response.</span>
        </div>
      )}
    </div>
  );
};

const TranscriptViewer = ({ responses, currentTime, onWordClick }) => {
  return (
    <div className="bg-card rounded-lg shadow-sm border border-border overflow-hidden">
      <div className="p-4 md:p-6 border-b border-border">
        <div className="flex items-center gap-3">
          <Icon name="FileText" size={24} color="var(--color-primary)" />
          <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
            Transcripts & Audio
          </h3>
        </div>
      </div>
      <div className="divide-y divide-border">
        {responses?.map((response, index) => {
          return (
            <div key={response.id || index} className="p-4 md:p-6">
              <ResponseAudioTranscript 
                response={response} 
                currentTime={currentTime} 
                onWordClick={onWordClick} 
              />
            </div>
        )})}
        {(!responses || responses.length === 0) && (
            <div className="p-8 text-center text-muted-foreground">
                No responses recorded.
            </div>
        )}
      </div>
    </div>
  );
};

export default TranscriptViewer;
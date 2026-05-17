import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import AudioPlayerWithWaveform from '../../student-audio-review/components/AudioPlayerWithWaveform';

const ResponseAudioTranscript = ({ response, onAddComment, idealAnswer, isRetake, attemptNumber }) => {
  const [currentTime, setCurrentTime] = useState(0);
  const [isIdealAnswerOpen, setIsIdealAnswerOpen] = useState(false);

  return (
    <div className="space-y-4">
      <div>
        <div className="flex items-center gap-2 mb-1">
          <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider block">
            {response.part ? `Part ${response.part}` : 'Question'}
          </span>
          {isRetake && (
            <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-warning/20 text-warning-foreground uppercase tracking-wider border border-warning/30">
              Retaken Answer {attemptNumber > 2 ? `(${attemptNumber - 1})` : ''}
            </span>
          )}
        </div>
        <p className="font-medium text-foreground text-lg">
          {response.question_text || "Question text not available"}
        </p>
      </div>
      
      {response.audioUrl && (
        <div className="mb-4">
          <AudioPlayerWithWaveform
            audioUrl={response.audioUrl}
            duration={response.audio_duration > 0 ? response.audio_duration : undefined}
            currentTime={currentTime}
            onTimeUpdate={(time) => setCurrentTime(time)}
            onSeek={(time) => setCurrentTime(time)}
            onAddComment={onAddComment ? () => onAddComment(response.id, currentTime) : undefined}
          />
        </div>
      )}

      {response.word_timestamps && response.word_timestamps.length > 0 ? (
        <div className="bg-muted/10 p-4 rounded-md border border-border/50">
          <p className="text-muted-foreground leading-relaxed">
            {response.word_timestamps.map((segment, idx) => {
              const isActive = currentTime >= segment.start && currentTime <= segment.end;
              return (
                <span 
                  key={idx}
                  onClick={() => setCurrentTime(segment.start)}
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

      {idealAnswer && (
        <div className="mt-4 border border-primary/20 rounded-lg overflow-hidden shadow-sm">
          <button
            onClick={() => setIsIdealAnswerOpen(!isIdealAnswerOpen)}
            className="w-full flex items-center justify-between p-3 bg-primary/5 hover:bg-primary/10 transition-colors"
          >
            <span className="text-sm font-bold text-primary uppercase tracking-wider flex items-center gap-2">
              <Icon name="Star" size={16} /> Ideal Answer (Band 7+)
            </span>
            <Icon name={isIdealAnswerOpen ? "ChevronUp" : "ChevronDown"} size={20} className="text-primary/70" />
          </button>
          {isIdealAnswerOpen && (
            <div className="p-5 bg-card text-base text-foreground leading-relaxed whitespace-pre-line italic">
              {idealAnswer}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const TranscriptViewer = ({ responses, onAddComment, idealAnswers, isFaculty = false }) => {
  const questionCounts = {};

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
          // Try to match the answer by question context, fallback to index order if exact match fails
          const matchedIdealAnswerData = idealAnswers?.find(
            (ia) => ia.question && response.question_text && response.question_text.toLowerCase().includes(ia.question.toLowerCase().substring(0, 15))
          ) || idealAnswers?.[index];

          // Track question occurrences to identify retakes
          const qKey = response.question_text || response.question_id || index;
          questionCounts[qKey] = (questionCounts[qKey] || 0) + 1;
          const attemptNumber = questionCounts[qKey];
          const isRetake = attemptNumber > 1 && isFaculty;

          return (
            <div key={response.id || index} className={`p-4 md:p-6 ${isRetake ? 'bg-warning/5' : ''}`}>
              <ResponseAudioTranscript 
                response={response} 
                onAddComment={onAddComment}
                idealAnswer={matchedIdealAnswerData?.ideal_answer} 
                isRetake={isRetake}
                attemptNumber={attemptNumber}
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
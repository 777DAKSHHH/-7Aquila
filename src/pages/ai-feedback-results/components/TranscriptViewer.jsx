import React from 'react';
import Icon from '../../../components/AppIcon';

const TranscriptViewer = ({ responses }) => {
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
          // Handle both object and array relational mapping
          const qObj = Array.isArray(response.speaking_questions) ? response.speaking_questions[0] : response.speaking_questions;
          
          return (
            <div key={response.id || index} className="p-4 md:p-6">
              <div className="space-y-4">
                <div>
                  <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider mb-1 block">
                    {qObj?.part ? `Part ${qObj.part}` : 'Question'}
                  </span>
                  <p className="font-medium text-foreground text-lg">
                    {qObj?.question_text || qObj?.question || "Question text not available"}
                  </p>
                </div>
                
              {response.audioUrl && (
                <div className="bg-muted/30 rounded-md p-3">
                  <audio controls className="w-full h-10 accent-primary" src={response.audioUrl} />
                </div>
              )}

              {response.transcript ? (
                <div className="bg-muted/10 p-4 rounded-md border border-border/50">
                  <p className="text-muted-foreground leading-relaxed">{response.transcript}</p>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground italic flex items-center gap-2">
                   <span>No transcript available for this response.</span>
                </div>
              )}
            </div>
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
import React from 'react';
import Icon from '../../../components/AppIcon';

const DiagnosticsPanel = ({ analytics = {} }) => {
  const {
    fluency_diagnosis = {},
    pronunciation_audit = [],
    cohesion_audit = {},
    bottleneck_analysis = {},
    self_correction_log = []
  } = analytics;

  // Render nothing if no diagnostics are present
  if (
    !fluency_diagnosis.pause_type_distribution &&
    (!pronunciation_audit || pronunciation_audit.length === 0) &&
    (!cohesion_audit.overused_linkers || cohesion_audit.overused_linkers.length === 0) &&
    !bottleneck_analysis.limiting_criteria &&
    (!self_correction_log || self_correction_log.length === 0)
  ) {
    return null;
  }

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border mt-6 md:mt-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary">
            <Icon name="Activity" size={24} />
          </div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
            Linguistic Audit & AI Diagnostics
          </h3>
        </div>
        <p className="text-sm md:text-base text-muted-foreground font-caption ml-13">
          Deep diagnostic metrics designed to correct subtle errors and boost your IELTS band score.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* 1. Score Bottleneck Analysis */}
        {bottleneck_analysis.limiting_criteria && (
          <div className="bg-destructive/5 border border-destructive/20 rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 text-destructive">
              <Icon name="AlertOctagon" size={20} />
              <h4 className="font-heading font-semibold text-base md:text-lg">Score Bottleneck Analysis</h4>
            </div>
            <p className="text-sm md:text-base text-foreground mb-2">
              <span className="font-semibold">Limiting Criteria:</span> {bottleneck_analysis.limiting_criteria}
            </p>
            <div className="bg-background/80 dark:bg-background/35 rounded p-3 border border-border">
              <p className="text-xs md:text-sm text-foreground leading-relaxed">
                <span className="font-semibold text-destructive">Key Actionable Focus:</span> {bottleneck_analysis.key_actionable_focus}
              </p>
            </div>
          </div>
        )}

        {/* 2. Fluency & Pacing Diagnosis */}
        {fluency_diagnosis.pause_type_distribution && (
          <div className="bg-blue-50/50 dark:bg-blue-950/10 border border-blue-200 dark:border-blue-900/30 rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 text-blue-600 dark:text-blue-400">
              <Icon name="Clock" size={20} />
              <h4 className="font-heading font-semibold text-base md:text-lg">Fluency & Hesitation Diagnosis</h4>
            </div>
            <p className="text-sm md:text-base text-foreground mb-3">
              <span className="font-semibold">Pause Distribution:</span> {fluency_diagnosis.pause_type_distribution}
            </p>
            {fluency_diagnosis.buying_time_recommendations && fluency_diagnosis.buying_time_recommendations.length > 0 && (
              <div>
                <span className="text-xs md:text-sm font-semibold text-muted-foreground block mb-2">Recommended Buying-Time Phrases:</span>
                <div className="flex flex-wrap gap-2">
                  {fluency_diagnosis.buying_time_recommendations.map((phrase, idx) => (
                    <span key={idx} className="bg-background dark:bg-background/40 border border-border px-2 py-1 rounded text-xs text-foreground font-mono">
                      "{phrase}"
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 3. Cohesion & Linker Audit */}
        {cohesion_audit.overused_linkers && cohesion_audit.overused_linkers.length > 0 && (
          <div className="bg-purple-50/50 dark:bg-purple-950/10 border border-purple-200 dark:border-purple-900/30 rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 text-purple-600 dark:text-purple-400">
              <Icon name="Shuffle" size={20} />
              <h4 className="font-heading font-semibold text-base md:text-lg">Cohesion & Transition Audit</h4>
            </div>
            <p className="text-sm text-foreground mb-3">
              <span className="font-semibold">Overused Connectors:</span> {cohesion_audit.overused_linkers.join(', ')}
            </p>
            {cohesion_audit.suggested_alternatives && cohesion_audit.suggested_alternatives.length > 0 && (
              <div>
                <span className="text-xs md:text-sm font-semibold text-muted-foreground block mb-2">Sophisticated Alternatives:</span>
                <div className="flex flex-wrap gap-2">
                  {cohesion_audit.suggested_alternatives.map((alt, idx) => (
                    <span key={idx} className="bg-purple-500/10 dark:bg-purple-500/20 text-purple-700 dark:text-purple-300 border border-purple-500/20 px-2.5 py-1 rounded-full text-xs font-semibold">
                      {alt}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* 4. Self-Correction Recognition */}
        {self_correction_log && self_correction_log.length > 0 && (
          <div className="bg-success/5 border border-success/20 rounded-lg p-4 md:p-5">
            <div className="flex items-center gap-2 mb-3 text-success">
              <Icon name="Award" size={20} />
              <h4 className="font-heading font-semibold text-base md:text-lg">Self-Correction Log</h4>
            </div>
            <div className="space-y-3">
              {self_correction_log.map((log, idx) => (
                <div key={idx} className="bg-background/80 dark:bg-background/35 p-3 rounded border border-border text-xs md:text-sm">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="text-red-500 line-through">"{log.original_error}"</span>
                    <Icon name="ArrowRight" size={12} className="text-muted-foreground" />
                    <span className="text-success font-semibold">"{log.corrected_to}"</span>
                  </div>
                  <p className="text-xs text-muted-foreground">{log.outcome}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 5. Pronunciation Syllable Stress Audit */}
      {pronunciation_audit && pronunciation_audit.length > 0 && (
        <div className="mt-6 bg-orange-50/50 dark:bg-orange-950/10 border border-orange-200 dark:border-orange-900/30 rounded-lg p-4 md:p-5">
          <div className="flex items-center gap-2 mb-4 text-orange-600 dark:text-orange-400">
            <Icon name="Mic" size={20} />
            <h4 className="font-heading font-semibold text-base md:text-lg">Pronunciation & Word Stress Audit</h4>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {pronunciation_audit.map((audit, idx) => (
              <div key={idx} className="bg-background/80 dark:bg-background/35 p-3.5 rounded border border-border flex flex-col justify-between">
                <div>
                  <span className="text-sm font-semibold text-foreground font-mono block mb-1">"{audit.word}"</span>
                  <p className="text-xs text-foreground leading-relaxed mb-2"><span className="font-semibold text-orange-600">Error:</span> {audit.detected_error}</p>
                </div>
                <div className="bg-orange-500/10 dark:bg-orange-500/20 text-orange-700 dark:text-orange-300 p-2.5 rounded text-xs border border-orange-500/10">
                  <span className="font-semibold">Tip:</span> {audit.syllable_stress_tip}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default DiagnosticsPanel;

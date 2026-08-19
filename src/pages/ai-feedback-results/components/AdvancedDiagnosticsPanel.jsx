import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const AdvancedDiagnosticsPanel = ({ analytics = {} }) => {
  const { advanced_diagnostics = {} } = analytics;
  const {
    peel_argument_builder = [],
    grammatical_diversity_matrix = {},
    overused_word_tracker = [],
    score_milestone_simulator = {},
    intonation_rhythm_audit = {}
  } = advanced_diagnostics;

  // Tabs for the 5 advanced diagnostics
  const [activeTab, setActiveTab] = useState('peel');

  // Verify if any advanced diagnostics exist
  if (
    (!peel_argument_builder || peel_argument_builder.length === 0) &&
    (!grammatical_diversity_matrix.checklist || grammatical_diversity_matrix.checklist.length === 0) &&
    (!overused_word_tracker || overused_word_tracker.length === 0) &&
    !score_milestone_simulator.current_band &&
    !intonation_rhythm_audit.thought_grouping_advice
  ) {
    return null;
  }

  const tabs = [
    { id: 'peel', name: 'PEEL Idea Builder', icon: 'FileText' },
    { id: 'grammar', name: 'Grammar Diversity', icon: 'Sliders' },
    { id: 'vocab', name: 'Redundancy Tracker', icon: 'Shuffle' },
    { id: 'milestone', name: 'Score Simulator', icon: 'TrendingUp' },
    { id: 'rhythm', name: 'Rhythm & Intonation', icon: 'Volume2' }
  ];

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border mt-6 md:mt-8">
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-2">
          <div className="w-10 h-10 rounded-full bg-emerald-500/10 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
            <Icon name="Activity" size={24} />
          </div>
          <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground">
            IELTS Examiner Master Diagnostics
          </h3>
        </div>
        <p className="text-sm md:text-base text-muted-foreground font-caption ml-13">
          Advanced examiner audits mapping speech structure, rhythmic pacing, and score simulations.
        </p>
      </div>

      {/* Responsive Tab Bar */}
      <div className="flex flex-wrap border-b border-border mb-6 gap-1.5 md:gap-2">
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-3 py-2 text-xs md:text-sm font-semibold border-b-2 transition-all ${
                isActive
                  ? 'border-primary text-primary bg-primary/5 rounded-t'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon name={tab.icon} size={16} />
              <span>{tab.name}</span>
            </button>
          );
        })}
      </div>

      {/* Tab Panels */}
      <div className="mt-4">
        
        {/* TAB 1: PEEL Idea Builder */}
        {activeTab === 'peel' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
              <h4 className="font-heading font-bold text-sm md:text-base text-foreground mb-1">
                PEEL Paragraph Structuring
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Examiners look for fully developed ideas. PEEL ensures you frame a Point, explain it, illustrate with an Example, and Link back logically.
              </p>
            </div>
            
            {peel_argument_builder.map((item, idx) => (
              <div key={idx} className="border border-border rounded-lg overflow-hidden">
                <div className="bg-slate-50 dark:bg-slate-900/35 p-3 md:p-4 border-b border-border">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Question {idx + 1}</span>
                  <p className="text-xs md:text-sm font-semibold text-foreground">"{item.question}"</p>
                  {item.student_idea && (
                    <p className="text-xs text-muted-foreground mt-2">
                      <span className="font-semibold text-foreground">Your original idea:</span> {item.student_idea}
                    </p>
                  )}
                </div>
                <div className="p-4 space-y-4 bg-background">
                  {/* Point */}
                  <div className="flex gap-3">
                    <span className="bg-emerald-500/10 text-emerald-700 dark:text-emerald-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded h-fit uppercase font-mono tracking-wider w-16 text-center">
                      Point
                    </span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      {item.peel_structure?.point}
                    </p>
                  </div>
                  {/* Explanation */}
                  <div className="flex gap-3">
                    <span className="bg-indigo-500/10 text-indigo-700 dark:text-indigo-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded h-fit uppercase font-mono tracking-wider w-16 text-center">
                      Explain
                    </span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      {item.peel_structure?.explanation}
                    </p>
                  </div>
                  {/* Example */}
                  <div className="flex gap-3">
                    <span className="bg-purple-500/10 text-purple-700 dark:text-purple-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded h-fit uppercase font-mono tracking-wider w-16 text-center">
                      Example
                    </span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      {item.peel_structure?.example}
                    </p>
                  </div>
                  {/* Link */}
                  <div className="flex gap-3">
                    <span className="bg-sky-500/10 text-sky-700 dark:text-sky-400 text-[10px] md:text-xs font-bold px-2 py-1 rounded h-fit uppercase font-mono tracking-wider w-16 text-center">
                      Link
                    </span>
                    <p className="text-xs md:text-sm text-foreground leading-relaxed">
                      {item.peel_structure?.link}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* TAB 2: Grammar Diversity Matrix */}
        {activeTab === 'grammar' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
              <h4 className="font-heading font-bold text-sm md:text-base text-foreground mb-1">
                Grammatical Structure Auditing
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                To achieve Band 7.0+, you must demonstrate a range of complex sentence types. Check your checklist below.
              </p>
            </div>

            {/* Checklist Grid */}
            <div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
              {grammatical_diversity_matrix.checklist?.map((item, idx) => {
                const isUsed = item.status === 'used' || item.count > 0;
                return (
                  <div
                    key={idx}
                    className={`p-3 rounded-lg border flex items-center justify-between transition-all ${
                      isUsed
                        ? 'bg-success/5 border-success/20 text-success'
                        : 'bg-slate-500/5 border-border text-muted-foreground'
                    }`}
                  >
                    <div>
                      <span className="text-xs font-bold block text-foreground">{item.structure_type}</span>
                      <span className="text-[10px] text-muted-foreground mt-0.5 block">{item.count || 0} times used</span>
                    </div>
                    <Icon name={isUsed ? 'CheckCircle' : 'AlertCircle'} size={18} />
                  </div>
                );
              })}
            </div>

            {/* Before / After Upgrade Block */}
            {grammatical_diversity_matrix.grammar_upgrade_example && (
              <div className="border border-border rounded-lg overflow-hidden mt-4">
                <div className="bg-slate-50 dark:bg-slate-900/35 p-3.5 border-b border-border">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-1">Grammar Upgrade Example</span>
                  <span className="text-xs text-muted-foreground">Structure upgrade used: <span className="font-bold text-foreground">{grammatical_diversity_matrix.grammar_upgrade_example.structure_type_used}</span></span>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-background">
                  <div class="bg-red-500/5 border border-red-500/10 rounded p-3">
                    <span class="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Original Simple Response:</span>
                    <p class="text-xs md:text-sm text-foreground">"{grammatical_diversity_matrix.grammar_upgrade_example.original_simple_sentence}"</p>
                  </div>
                  <div class="bg-success/5 border border-success/10 rounded p-3">
                    <span class="text-[10px] font-bold text-success uppercase tracking-wider block mb-1">Band 7.5+ Upgraded Clause:</span>
                    <p class="text-xs md:text-sm text-foreground">"{grammatical_diversity_matrix.grammar_upgrade_example.upgraded_complex_sentence}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Overused Word Tracker */}
        {activeTab === 'vocab' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
              <h4 className="font-heading font-bold text-sm md:text-base text-foreground mb-1">
                Linguistic Redundancy audit
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Avoid repeating common adjectives and verbs. Diversify your vocabulary with these synonyms.
              </p>
            </div>

            <div className="space-y-3">
              {overused_word_tracker.map((item, idx) => (
                <div key={idx} className="bg-background rounded-lg border border-border p-4 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="bg-red-500/10 border border-red-500/20 text-red-600 rounded px-2.5 py-1 text-center">
                      <span className="text-xs font-bold block">"{item.word}"</span>
                      <span className="text-[9px] uppercase tracking-wider block mt-0.5">{item.frequency} times</span>
                    </div>
                    <Icon name="ArrowRight" size={16} className="text-muted-foreground" />
                  </div>
                  <div className="flex-1">
                    <span className="text-xs text-muted-foreground block mb-1.5">Recommended IELTS Substitutes:</span>
                    <div className="flex flex-wrap gap-1.5">
                      {item.suggested_alternatives?.map((synonym, sIdx) => (
                        <span key={sIdx} className="bg-primary/5 hover:bg-primary/10 border border-primary/20 text-primary px-2.5 py-1 rounded-full text-xs font-semibold">
                          {synonym}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* TAB 4: Next Milestone Score Simulator */}
        {activeTab === 'milestone' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
              <h4 className="font-heading font-bold text-sm md:text-base text-foreground mb-1">
                IELTS Target Score Simulator
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                A custom simulation mapping the most efficient score progression steps for your next test attempt.
              </p>
            </div>

            {/* Score Tracker Bar */}
            <div className="bg-background border border-border rounded-xl p-6 relative overflow-hidden flex flex-col sm:flex-row items-center justify-around gap-6">
              <div className="text-center">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Current speaking Band</span>
                <span className="text-4xl md:text-5xl font-black text-foreground block mt-1">{score_milestone_simulator.current_band?.toFixed(1) || '6.0'}</span>
              </div>
              <div className="hidden sm:flex items-center text-primary animate-pulse">
                <Icon name="ChevronsRight" size={32} />
              </div>
              <div className="text-center">
                <span className="text-xs text-muted-foreground uppercase font-bold tracking-wider">Next Target Milestone</span>
                <span className="text-4xl md:text-5xl font-black text-primary block mt-1">{score_milestone_simulator.next_milestone_band?.toFixed(1) || '6.5'}</span>
              </div>
            </div>

            {/* Action Steps */}
            {score_milestone_simulator.actionable_steps && (
              <div className="bg-slate-50 dark:bg-slate-900/30 border border-border rounded-lg p-5">
                <span className="text-xs md:text-sm font-bold text-foreground block mb-3">Key Action Milestones to reach next Band:</span>
                <ul className="space-y-3">
                  {score_milestone_simulator.actionable_steps.map((step, idx) => (
                    <li key={idx} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-primary/20 text-primary flex items-center justify-center text-xs font-bold mt-0.5 flex-shrink-0">
                        {idx + 1}
                      </div>
                      <p className="text-xs md:text-sm text-foreground leading-relaxed">{step}</p>
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* TAB 5: Rhythm & Intonation Audit */}
        {activeTab === 'rhythm' && (
          <div className="space-y-6">
            <div className="bg-slate-50 dark:bg-slate-900/30 p-4 rounded-lg border border-border">
              <h4 className="font-heading font-bold text-sm md:text-base text-foreground mb-1">
                Speech Delivery & Chunking Rhythm
              </h4>
              <p className="text-xs md:text-sm text-muted-foreground">
                Intonation and grouping words correctly represents 50% of your Pronunciation criteria. Monotone rhythms cap your score at a 6.0.
              </p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="bg-background border border-border rounded-lg p-4">
                <span className="text-[10px] uppercase font-bold text-blue-500 block mb-1.5">Thought-Grouping Guidelines</span>
                <p className="text-xs md:text-sm text-foreground leading-relaxed">{intonation_rhythm_audit.thought_grouping_advice}</p>
              </div>
              <div className="bg-background border border-border rounded-lg p-4">
                <span className="text-[10px] uppercase font-bold text-indigo-500 block mb-1.5">Rhythmic Pacing Audit</span>
                <p className="text-xs md:text-sm text-foreground leading-relaxed">{intonation_rhythm_audit.rhythmic_pacing_note}</p>
              </div>
            </div>

            {/* Chunking Comparative card */}
            {intonation_rhythm_audit.word_chunking_example && (
              <div className="border border-border rounded-lg overflow-hidden mt-4">
                <div className="bg-slate-50 dark:bg-slate-900/35 p-3.5 border-b border-border">
                  <span className="text-[10px] uppercase font-bold text-primary tracking-wider block mb-0.5">Word Chunking & Natural Pauses</span>
                  <span className="text-xs text-muted-foreground font-caption">Shows the difference between unnatural pauses and correct native chunking rhythms.</span>
                </div>
                <div class="p-4 grid grid-cols-1 md:grid-cols-2 gap-4 bg-background">
                  <div class="bg-red-500/5 border border-red-500/10 rounded p-3">
                    <span class="text-[10px] font-bold text-red-500 uppercase tracking-wider block mb-1">Problematic Rhythm (Unnatural Pause):</span>
                    <p class="text-xs md:text-sm text-foreground">"{intonation_rhythm_audit.word_chunking_example.problematic_chunk}"</p>
                  </div>
                  <div class="bg-success/5 border border-success/10 rounded p-3">
                    <span class="text-[10px] font-bold text-success uppercase tracking-wider block mb-1">Correct Rhythmic Thought-Groups:</span>
                    <p class="text-xs md:text-sm text-foreground">"{intonation_rhythm_audit.word_chunking_example.correct_chunk}"</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};

export default AdvancedDiagnosticsPanel;

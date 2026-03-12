import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';
import Input from '../../../components/ui/Input';
import { Checkbox } from '../../../components/ui/Checkbox';

const FeedbackPanel = ({ onSaveFeedback, onSendToStudent, existingFeedback }) => {
  const [feedbackText, setFeedbackText] = useState(existingFeedback?.text || '');
  const [isRecordingVoice, setIsRecordingVoice] = useState(false);
  const [voiceRecordingTime, setVoiceRecordingTime] = useState(0);
  const [overrideScores, setOverrideScores] = useState({
    overall: existingFeedback?.overrideScores?.overall || '',
    fluency: existingFeedback?.overrideScores?.fluency || '',
    lexical: existingFeedback?.overrideScores?.lexical || '',
    grammar: existingFeedback?.overrideScores?.grammar || '',
    pronunciation: existingFeedback?.overrideScores?.pronunciation || '',
  });
  const [selectedTemplates, setSelectedTemplates] = useState([]);
  const [activeTab, setActiveTab] = useState('text');

  const feedbackTemplates = [
    {
      id: 1,
      title: 'Excellent Fluency',
      content: 'Your speech flows naturally with minimal hesitation. Continue practicing to maintain this level.',
    },
    {
      id: 2,
      title: 'Vocabulary Enhancement',
      content: 'Consider using more varied vocabulary. Try incorporating synonyms and topic-specific terms.',
    },
    {
      id: 3,
      title: 'Grammar Improvement',
      content: 'Focus on complex sentence structures. Practice using conditional and relative clauses.',
    },
    {
      id: 4,
      title: 'Pronunciation Practice',
      content: 'Work on word stress and intonation patterns. Listen to native speakers and mimic their pronunciation.',
    },
    {
      id: 5,
      title: 'Reduce Fillers',
      content: 'Try to minimize filler words like "um", "uh", and "like". Pause briefly instead of using fillers.',
    },
    {
      id: 6,
      title: 'Coherence Tips',
      content: 'Use linking words effectively to connect your ideas. Practice organizing thoughts before speaking.',
    },
  ];

  const handleTemplateToggle = (template) => {
    if (selectedTemplates?.find((t) => t?.id === template?.id)) {
      setSelectedTemplates(selectedTemplates?.filter((t) => t?.id !== template?.id));
      setFeedbackText(feedbackText?.replace(template?.content + '\n\n', ''));
    } else {
      setSelectedTemplates([...selectedTemplates, template]);
      setFeedbackText(feedbackText + (feedbackText ? '\n\n' : '') + template?.content);
    }
  };

  const handleVoiceRecording = () => {
    if (isRecordingVoice) {
      setIsRecordingVoice(false);
      setVoiceRecordingTime(0);
    } else {
      setIsRecordingVoice(true);
      const interval = setInterval(() => {
        setVoiceRecordingTime((prev) => prev + 1);
      }, 1000);
      setTimeout(() => {
        clearInterval(interval);
        setIsRecordingVoice(false);
      }, 120000);
    }
  };

  const handleSave = () => {
    onSaveFeedback({
      text: feedbackText,
      overrideScores,
      templates: selectedTemplates,
      voiceRecording: isRecordingVoice ? null : voiceRecordingTime > 0,
    });
  };

  const formatRecordingTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${String(mins)?.padStart(2, '0')}:${String(secs)?.padStart(2, '0')}`;
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Icon name="MessageSquare" size={24} color="var(--color-primary)" />
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          Faculty Feedback
        </h3>
      </div>
      <div className="flex gap-2 mb-4 border-b border-border overflow-x-auto">
        <button
          onClick={() => setActiveTab('text')}
          className={`flex items-center gap-2 px-4 py-2 font-caption font-medium transition-all duration-base flex-shrink-0 ${
            activeTab === 'text' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="FileText" size={16} />
          <span>Text Feedback</span>
        </button>
        <button
          onClick={() => setActiveTab('voice')}
          className={`flex items-center gap-2 px-4 py-2 font-caption font-medium transition-all duration-base flex-shrink-0 ${
            activeTab === 'voice' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="Mic" size={16} />
          <span>Voice Feedback</span>
        </button>
        <button
          onClick={() => setActiveTab('scores')}
          className={`flex items-center gap-2 px-4 py-2 font-caption font-medium transition-all duration-base flex-shrink-0 ${
            activeTab === 'scores' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="Award" size={16} />
          <span>Override Scores</span>
        </button>
        <button
          onClick={() => setActiveTab('templates')}
          className={`flex items-center gap-2 px-4 py-2 font-caption font-medium transition-all duration-base flex-shrink-0 ${
            activeTab === 'templates' ?'text-primary border-b-2 border-primary' :'text-muted-foreground hover:text-foreground'
          }`}
        >
          <Icon name="Layout" size={16} />
          <span>Templates</span>
        </button>
      </div>
      {activeTab === 'text' && (
        <div className="space-y-4">
          <textarea
            value={feedbackText}
            onChange={(e) => setFeedbackText(e?.target?.value)}
            placeholder="Enter your detailed feedback for the student..."
            className="w-full min-h-[200px] md:min-h-[250px] p-4 bg-input border border-border rounded-md text-foreground placeholder:text-muted-foreground focus-ring resize-none"
          />
          <div className="flex items-center justify-between text-sm text-muted-foreground">
            <span className="font-caption">{feedbackText?.length} characters</span>
            <Button variant="ghost" size="sm" iconName="RotateCcw" onClick={() => setFeedbackText('')}>
              Clear
            </Button>
          </div>
        </div>
      )}
      {activeTab === 'voice' && (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-md p-6 md:p-8 flex flex-col items-center justify-center min-h-[200px]">
            {isRecordingVoice ? (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-error/20 flex items-center justify-center mb-4 animate-pulse">
                  <Icon name="Mic" size={32} color="var(--color-error)" />
                </div>
                <p className="text-2xl md:text-3xl font-mono font-semibold text-foreground mb-2">
                  {formatRecordingTime(voiceRecordingTime)}
                </p>
                <p className="text-sm text-muted-foreground font-caption">Recording voice feedback...</p>
              </>
            ) : (
              <>
                <div className="w-16 h-16 md:w-20 md:h-20 rounded-full bg-primary/10 flex items-center justify-center mb-4">
                  <Icon name="Mic" size={32} color="var(--color-primary)" />
                </div>
                <p className="text-base md:text-lg text-foreground mb-2">Ready to record voice feedback</p>
                <p className="text-sm text-muted-foreground font-caption">Maximum duration: 2 minutes</p>
              </>
            )}
          </div>
          <Button
            variant={isRecordingVoice ? 'destructive' : 'default'}
            fullWidth
            iconName={isRecordingVoice ? 'Square' : 'Mic'}
            iconPosition="left"
            onClick={handleVoiceRecording}
          >
            {isRecordingVoice ? 'Stop Recording' : 'Start Voice Recording'}
          </Button>
        </div>
      )}
      {activeTab === 'scores' && (
        <div className="space-y-4">
          <div className="bg-muted/30 rounded-md p-4 mb-4">
            <div className="flex items-start gap-2">
              <Icon name="Info" size={16} color="var(--color-primary)" className="mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground font-caption">
                Override AI-generated scores if you believe adjustments are needed. Leave blank to keep AI scores.
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Input
              label="Overall Band Score"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="e.g., 7.5"
              value={overrideScores?.overall}
              onChange={(e) => setOverrideScores({ ...overrideScores, overall: e?.target?.value })}
            />
            <Input
              label="Fluency & Coherence"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="e.g., 7.0"
              value={overrideScores?.fluency}
              onChange={(e) => setOverrideScores({ ...overrideScores, fluency: e?.target?.value })}
            />
            <Input
              label="Lexical Resource"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="e.g., 7.5"
              value={overrideScores?.lexical}
              onChange={(e) => setOverrideScores({ ...overrideScores, lexical: e?.target?.value })}
            />
            <Input
              label="Grammar Range & Accuracy"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="e.g., 7.0"
              value={overrideScores?.grammar}
              onChange={(e) => setOverrideScores({ ...overrideScores, grammar: e?.target?.value })}
            />
            <Input
              label="Pronunciation"
              type="number"
              min="0"
              max="9"
              step="0.5"
              placeholder="e.g., 8.0"
              value={overrideScores?.pronunciation}
              onChange={(e) => setOverrideScores({ ...overrideScores, pronunciation: e?.target?.value })}
              className="md:col-span-2"
            />
          </div>
        </div>
      )}
      {activeTab === 'templates' && (
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground font-caption mb-4">
            Select pre-written feedback templates to quickly add to your comments
          </p>
          {feedbackTemplates?.map((template) => (
            <div
              key={template?.id}
              className={`border rounded-md p-4 transition-all duration-base cursor-pointer ${
                selectedTemplates?.find((t) => t?.id === template?.id)
                  ? 'border-primary bg-primary/5' :'border-border hover:border-primary/50'
              }`}
              onClick={() => handleTemplateToggle(template)}
            >
              <div className="flex items-start gap-3">
                <Checkbox
                  checked={!!selectedTemplates?.find((t) => t?.id === template?.id)}
                  onChange={() => handleTemplateToggle(template)}
                />
                <div className="flex-1">
                  <h4 className="font-medium text-foreground mb-1">{template?.title}</h4>
                  <p className="text-sm text-muted-foreground font-caption">{template?.content}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      <div className="mt-6 pt-6 border-t border-border flex flex-col md:flex-row gap-3">
        <Button variant="outline" fullWidth iconName="Save" iconPosition="left" onClick={handleSave}>
          Save Feedback
        </Button>
        <Button variant="default" fullWidth iconName="Send" iconPosition="left" onClick={onSendToStudent}>
          Send to Student
        </Button>
        <Button variant="ghost" fullWidth iconName="CheckCircle" iconPosition="left">
          Mark as Reviewed
        </Button>
      </div>
    </div>
  );
};

export default FeedbackPanel;
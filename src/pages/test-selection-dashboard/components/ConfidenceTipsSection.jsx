import React from 'react';
import Icon from '../../../components/AppIcon';

const ConfidenceTipsSection = () => {
  const tips = [
    {
      icon: 'Brain',
      title: 'Practice Deep Breathing',
      description: 'Take 3 deep breaths before starting. Inhale for 4 counts, hold for 4, exhale for 4. This calms your nervous system and improves focus.',
    },
    {
      icon: 'Volume2',
      title: 'Speak Clearly and Naturally',
      description: 'Focus on clear pronunciation rather than speed. It\'s better to speak slowly and clearly than to rush through your answers.',
    },
    {
      icon: 'BookOpen',
      title: 'Use the Preparation Time',
      description: 'In Part 2, use the full minute to organize your thoughts. Write down key points and structure your response with introduction, body, and conclusion.',
    },
    {
      icon: 'Lightbulb',
      title: 'Expand Your Answers',
      description: 'Don\'t give one-word answers. Use examples, reasons, and personal experiences to elaborate on your points. Aim for 3-4 sentences per response.',
    },
    {
      icon: 'Target',
      title: 'Stay on Topic',
      description: 'Listen carefully to each question and address it directly. If you don\'t understand, politely ask for clarification rather than guessing.',
    },
    {
      icon: 'Smile',
      title: 'Maintain Positive Body Language',
      description: 'Even though this is audio-only, sitting upright and smiling while speaking can improve your tone and confidence. Your posture affects your voice quality.',
    },
  ];

  return (
    <div id="confidence-tips" className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 md:w-12 md:h-12 rounded-full bg-accent/10 flex items-center justify-center">
          <Icon name="Lightbulb" size={24} color="var(--color-accent)" />
        </div>
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground">
            Confidence Boosting Tips
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            Prepare yourself mentally before starting the test
          </p>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 md:gap-6">
        {tips?.map((tip, index) => (
          <div key={index} className="bg-muted/30 rounded-lg p-4 hover:bg-muted/50 transition-all duration-base">
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                <Icon name={tip?.icon} size={20} color="var(--color-primary)" />
              </div>
              <div className="flex-1">
                <h4 className="text-base md:text-lg font-heading font-semibold text-foreground mb-2">
                  {tip?.title}
                </h4>
                <p className="text-sm md:text-base text-muted-foreground font-caption leading-relaxed">
                  {tip?.description}
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 p-4 bg-accent/10 border border-accent/20 rounded-lg">
        <div className="flex items-start gap-3">
          <Icon name="Info" size={20} color="var(--color-accent)" className="flex-shrink-0 mt-0.5" />
          <p className="text-sm md:text-base text-foreground font-caption">
            <strong>Remember:</strong> The IELTS Speaking test assesses your ability to communicate effectively in English. Focus on expressing your ideas clearly rather than using complex vocabulary you're not comfortable with. Authenticity and fluency matter more than perfection.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ConfidenceTipsSection;
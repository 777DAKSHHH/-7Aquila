import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';

const AIAssessmentDetails = ({ assessment }) => {
  const [expandedSection, setExpandedSection] = useState(null);

  const assessmentSections = [
    {
      id: 'fluency',
      title: 'Fluency & Coherence',
      score: assessment?.fluency?.score,
      icon: 'MessageCircle',
      color: 'primary',
      strengths: assessment?.fluency?.strengths,
      improvements: assessment?.fluency?.improvements,
      details: assessment?.fluency?.details,
    },
    {
      id: 'lexical',
      title: 'Lexical Resource',
      score: assessment?.lexical?.score,
      icon: 'BookOpen',
      color: 'accent',
      strengths: assessment?.lexical?.strengths,
      improvements: assessment?.lexical?.improvements,
      details: assessment?.lexical?.details,
    },
    {
      id: 'grammar',
      title: 'Grammar Range & Accuracy',
      score: assessment?.grammar?.score,
      icon: 'CheckCircle',
      color: 'success',
      strengths: assessment?.grammar?.strengths,
      improvements: assessment?.grammar?.improvements,
      details: assessment?.grammar?.details,
    },
    {
      id: 'pronunciation',
      title: 'Pronunciation',
      score: assessment?.pronunciation?.score,
      icon: 'Volume2',
      color: 'secondary',
      strengths: assessment?.pronunciation?.strengths,
      improvements: assessment?.pronunciation?.improvements,
      details: assessment?.pronunciation?.details,
    },
  ];

  const toggleSection = (sectionId) => {
    setExpandedSection(expandedSection === sectionId ? null : sectionId);
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex items-center gap-3 mb-4 md:mb-6">
        <Icon name="Brain" size={24} color="var(--color-primary)" />
        <h3 className="text-lg md:text-xl font-heading font-semibold text-foreground">
          AI Assessment Details
        </h3>
      </div>
      <div className="space-y-3">
        {assessmentSections?.map((section) => (
          <div key={section?.id} className="border border-border rounded-lg overflow-hidden">
            <button
              onClick={() => toggleSection(section?.id)}
              className="w-full flex items-center justify-between p-4 hover:bg-muted/50 transition-all duration-base"
            >
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full bg-${section?.color}/10 flex items-center justify-center`}>
                  <Icon name={section?.icon} size={20} color={`var(--color-${section?.color})`} />
                </div>
                <div className="text-left">
                  <h4 className="font-medium text-foreground">{section?.title}</h4>
                  <p className="text-sm text-muted-foreground font-caption">Band Score: {section?.score}</p>
                </div>
              </div>
              <Icon
                name={expandedSection === section?.id ? 'ChevronUp' : 'ChevronDown'}
                size={20}
                color="var(--color-muted-foreground)"
              />
            </button>

            {expandedSection === section?.id && (
              <div className="p-4 bg-muted/30 border-t border-border space-y-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="ThumbsUp" size={16} color="var(--color-success)" />
                    <h5 className="font-medium text-foreground text-sm">Strengths</h5>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {section?.strengths?.map((strength, index) => (
                      <li key={index} className="text-sm text-muted-foreground font-caption list-disc">
                        {strength}
                      </li>
                    ))}
                  </ul>
                </div>

                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="TrendingUp" size={16} color="var(--color-warning)" />
                    <h5 className="font-medium text-foreground text-sm">Areas for Improvement</h5>
                  </div>
                  <ul className="space-y-1 ml-6">
                    {section?.improvements?.map((improvement, index) => (
                      <li key={index} className="text-sm text-muted-foreground font-caption list-disc">
                        {improvement}
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="pt-3 border-t border-border">
                  <p className="text-sm text-muted-foreground font-caption">{section?.details}</p>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="bg-primary/5 rounded-md p-4">
          <div className="flex items-start gap-3">
            <Icon name="Lightbulb" size={20} color="var(--color-primary)" className="mt-0.5 flex-shrink-0" />
            <div>
              <h4 className="font-medium text-foreground mb-2">Overall AI Recommendation</h4>
              <p className="text-sm text-muted-foreground font-caption">{assessment?.overallRecommendation}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AIAssessmentDetails;
import React, { useState } from 'react';
import Icon from '../../../components/AppIcon';
import Button from '../../../components/ui/Button';

const VocabularyEnhancement = ({ 
  recommendations = [],
  topicWords = [],
  phrases = []
}) => {
  const [activeTab, setActiveTab] = useState('recommendations');

  const tabs = [
    { id: 'recommendations', label: 'Recommendations', icon: 'Star' },
    { id: 'topicWords', label: 'Topic Words', icon: 'BookOpen' },
    { id: 'phrases', label: 'Useful Phrases', icon: 'MessageSquare' }
  ];

  const renderContent = () => {
    switch (activeTab) {
      case 'recommendations':
        return (
          <div className="space-y-4">
            {recommendations?.map((item, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4 md:p-5">
                <div className="flex items-start gap-3 mb-3">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center flex-shrink-0">
                    <span className="text-sm font-heading font-bold text-primary">{index + 1}</span>
                  </div>
                  <div className="flex-1">
                    <div className="flex flex-col sm:flex-row sm:items-center gap-2 mb-2">
                      <span className="text-sm md:text-base font-medium text-foreground">
                        Instead of: <span className="text-error">{item?.instead_of}</span>
                      </span>
                      <Icon name="ArrowRight" size={16} color="var(--color-muted-foreground)" className="hidden sm:block" />
                      <span className="text-sm md:text-base font-medium text-foreground">
                        Try: <span className="text-success">{Array.isArray(item?.better) ? item.better.join(', ') : item?.better}</span>
                      </span>
                    </div>
                    <p className="text-sm text-muted-foreground font-caption">
                      {item?.reason}
                    </p>
                    <div className="mt-2 text-xs md:text-sm text-muted-foreground font-caption italic">
                      Example: "{item?.example}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      case 'topicWords':
        return (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {topicWords?.map((word, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start justify-between gap-3 mb-2">
                  <h5 className="text-sm md:text-base font-heading font-semibold text-foreground">
                    {word?.word}
                  </h5>
                  <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full font-caption whitespace-nowrap">
                    {word?.level}
                  </span>
                </div>
                <p className="text-sm text-muted-foreground font-caption mb-2">
                  {word?.meaning}
                </p>
                <div className="text-xs md:text-sm text-foreground italic">
                  "{word?.example}"
                </div>
              </div>
            ))}
          </div>
        );

      case 'phrases':
        return (
          <div className="space-y-3">
            {phrases?.map((phrase, index) => (
              <div key={index} className="bg-muted/30 rounded-lg p-4">
                <div className="flex items-start gap-3">
                  <Icon name="Quote" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-1" />
                  <div className="flex-1">
                    <p className="text-sm md:text-base font-medium text-foreground mb-2">
                      "{phrase?.phrase}"
                    </p>
                    <p className="text-sm text-muted-foreground font-caption mb-2">
                      {phrase?.usage}
                    </p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground font-caption">
                      <Icon name="Tag" size={14} />
                      <span>{phrase?.category}</span>
                    </div>
                    <div className="mt-2 text-xs md:text-sm text-foreground italic">
                      "{phrase?.example}"
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border">
      <div className="mb-6">
        <h3 className="text-lg md:text-xl lg:text-2xl font-heading font-semibold text-foreground mb-2">
          Vocabulary Enhancement
        </h3>
        <p className="text-sm md:text-base text-muted-foreground font-caption">
          Expand your vocabulary with topic-relevant words and phrases
        </p>
      </div>
      <div className="flex flex-wrap gap-2 mb-6 border-b border-border pb-4">
        {tabs?.map((tab) => (
          <button
            key={tab?.id}
            onClick={() => setActiveTab(tab?.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-md font-medium transition-all duration-base ${
              activeTab === tab?.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-foreground hover:bg-muted/80'
            }`}
          >
            <Icon name={tab?.icon} size={18} />
            <span className="text-sm md:text-base">{tab?.label}</span>
          </button>
        ))}
      </div>
      <div className="min-h-[300px]">
        {renderContent()}
      </div>
      <div className="mt-6 pt-6 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="flex items-start gap-3">
            <Icon name="Info" size={20} color="var(--color-primary)" className="flex-shrink-0 mt-1" />
            <p className="text-sm text-muted-foreground font-caption">
              Practice using these words and phrases in your next speaking session to improve your Lexical Resource score.
            </p>
          </div>
          <Button variant="outline" size="sm" iconName="Download" iconPosition="left">
            Export List
          </Button>
        </div>
      </div>
    </div>
  );
};

export default VocabularyEnhancement;
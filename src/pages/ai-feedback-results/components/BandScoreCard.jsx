import React from 'react';
import Icon from '../../../components/AppIcon';

const BandScoreCard = ({ 
  overallScore = 0, 
  criteriaScores = {},
  testDate = '',
  testType = ''
}) => {
  const criteria = [
    { 
      key: 'fluency', 
      label: 'Fluency & Coherence', 
      score: criteriaScores?.fluency || 0,
      icon: 'MessageCircle',
      color: 'text-blue-600'
    },
    { 
      key: 'lexical', 
      label: 'Lexical Resource', 
      score: criteriaScores?.lexical || 0,
      icon: 'BookOpen',
      color: 'text-purple-600'
    },
    { 
      key: 'grammar', 
      label: 'Grammar Range & Accuracy', 
      score: criteriaScores?.grammar || 0,
      icon: 'FileText',
      color: 'text-green-600'
    },
    { 
      key: 'pronunciation', 
      label: 'Pronunciation', 
      score: criteriaScores?.pronunciation || 0,
      icon: 'Mic',
      color: 'text-orange-600'
    }
  ];

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5.5) return 'text-warning';
    return 'text-error';
  };

  const getProgressColor = (score) => {
    if (score >= 7) return 'bg-success';
    if (score >= 5.5) return 'bg-warning';
    return 'bg-error';
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-md border border-border">
      <div className="flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4 mb-6 md:mb-8">
        <div>
          <h2 className="text-xl md:text-2xl lg:text-3xl font-heading font-semibold text-foreground mb-2">
            Your IELTS Speaking Band Score
          </h2>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            {testType} • {testDate}
          </p>
        </div>
        <div className="flex items-center gap-3 bg-primary/10 px-4 md:px-6 py-3 md:py-4 rounded-lg">
          <Icon name="Award" size={32} color="var(--color-primary)" />
          <div>
            <p className="text-xs md:text-sm text-muted-foreground font-caption">Overall Band</p>
            <p className={`text-3xl md:text-4xl lg:text-5xl font-heading font-bold ${getScoreColor(overallScore)}`}>
              {overallScore?.toFixed(1)}
            </p>
          </div>
        </div>
      </div>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
        {criteria?.map((criterion) => (
          <div key={criterion?.key} className="bg-muted/30 rounded-lg p-4 md:p-5">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className={`w-10 h-10 md:w-12 md:h-12 rounded-full bg-background flex items-center justify-center ${criterion?.color}`}>
                  <Icon name={criterion?.icon} size={20} />
                </div>
                <div>
                  <p className="text-sm md:text-base font-medium text-foreground">{criterion?.label}</p>
                  <p className={`text-xl md:text-2xl font-heading font-bold ${getScoreColor(criterion?.score)}`}>
                    {criterion?.score?.toFixed(1)}
                  </p>
                </div>
              </div>
            </div>
            <div className="relative w-full h-2 bg-muted rounded-full overflow-hidden">
              <div 
                className={`absolute top-0 left-0 h-full ${getProgressColor(criterion?.score)} transition-all duration-500`}
                style={{ width: `${(criterion?.score / 9) * 100}%` }}
              />
            </div>
          </div>
        ))}
      </div>
      <div className="mt-6 md:mt-8 pt-6 md:pt-8 border-t border-border">
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Icon name="Info" size={18} />
            <span className="text-sm font-caption">Band Score Range: 0-9</span>
          </div>
          <div className="flex items-center gap-2 text-success">
            <div className="w-3 h-3 rounded-full bg-success" />
            <span className="text-sm font-caption">7.0+ Excellent</span>
          </div>
          <div className="flex items-center gap-2 text-warning">
            <div className="w-3 h-3 rounded-full bg-warning" />
            <span className="text-sm font-caption">5.5-6.5 Good</span>
          </div>
          <div className="flex items-center gap-2 text-error">
            <div className="w-3 h-3 rounded-full bg-error" />
            <span className="text-sm font-caption">&lt;5.5 Needs Improvement</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default BandScoreCard;
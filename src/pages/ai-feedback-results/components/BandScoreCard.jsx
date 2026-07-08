import React from 'react';
import Icon from '../../../components/AppIcon';

const ScorePill = ({ label, score, colorClass = 'bg-primary text-primary-foreground' }) => (
  <div className="text-center">
    <p className="text-xs font-caption text-muted-foreground mb-1">{label}</p>
    <p className={`text-lg font-semibold mono rounded-full px-3 py-1 inline-block ${colorClass}`}>
      {score?.toFixed(1) || 'N/A'}
    </p>
  </div>
);

const BandScoreCard = ({ session, testDate, testType }) => {
  const isReviewed = !!session.teacher_band_score;

  const aiScores = {
    overall: session.ai_band_score,
    fluency: session.ai_detailed_feedback?.scores?.fluency || 0,
    lexical: session.ai_detailed_feedback?.scores?.lexical || 0,
    grammar: session.ai_detailed_feedback?.scores?.grammar || 0,
    pronunciation: session.ai_detailed_feedback?.scores?.pronunciation || 0,
  };

  const teacherScores = {
    overall: session.teacher_band_score,
    fluency: session.teacher_fluency_score,
    lexical: session.teacher_lexical_score,
    grammar: session.teacher_grammar_score,
    pronunciation: session.teacher_pronunciation_score,
  };

  const finalScores = isReviewed ? teacherScores : aiScores;

  const getScoreColor = (score) => {
    if (score >= 7) return 'text-success';
    if (score >= 5.5) return 'text-warning';
    return 'text-error';
  };

  return (
    <div className="bg-card rounded-lg p-4 md:p-6 lg:p-8 shadow-sm border border-border">
      <div className="flex flex-col md:flex-row items-center justify-between gap-4">
        {/* Final Overall Score */}
        <div className="text-center md:text-left">
          <h3 className="text-base font-medium text-muted-foreground mb-1">
            {isReviewed ? 'Official Band Score' : 'AI Estimated Band Score'}
          </h3>
          <p className={`text-5xl md:text-6xl font-heading font-bold ${getScoreColor(finalScores.overall)}`}>
            {finalScores.overall?.toFixed(1) || 'N/A'}
          </p>
        </div>

        {/* Detailed Scores */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <ScorePill label="Fluency" score={finalScores.fluency} />
          <ScorePill label="Lexical" score={finalScores.lexical} />
          <ScorePill label="Grammar" score={finalScores.grammar} />
          <ScorePill label="Pronunciation" score={finalScores.pronunciation} />
        </div>
      </div>

      {isReviewed && (
        <div className="mt-6 pt-6 border-t border-border">
          <div className="bg-primary/5 rounded-md p-4">
            <div className="flex items-start gap-3">
              <Icon name="UserCheck" size={20} className="text-primary mt-0.5 flex-shrink-0" />
              <div>
                <h4 className="font-medium text-foreground mb-2">Faculty Review</h4>
                <p className="text-sm text-muted-foreground font-caption">
                  A faculty member has reviewed your submission and provided the official scores.
                  The original AI scores are shown below for comparison.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
            <ScorePill label="AI Fluency" score={aiScores.fluency} colorClass="bg-muted text-muted-foreground" />
            <ScorePill label="AI Lexical" score={aiScores.lexical} colorClass="bg-muted text-muted-foreground" />
            <ScorePill label="AI Grammar" score={aiScores.grammar} colorClass="bg-muted text-muted-foreground" />
            <ScorePill label="AI Pronunciation" score={aiScores.pronunciation} colorClass="bg-muted text-muted-foreground" />
          </div>
        </div>
      )}

      <div className="mt-6 pt-6 border-t border-border">
        <div>
          <p className="text-sm md:text-base text-muted-foreground font-caption">
            {testType} • {testDate}
          </p>
        </div>
      </div>
    </div>
  );
};

export default BandScoreCard;
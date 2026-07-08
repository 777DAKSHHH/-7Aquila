export const getAttemptScores = (attempt) => {
  const isReviewed = !!attempt.teacher_band_score;
  if (isReviewed) {
    return {
      overall: attempt.teacher_band_score,
      fluency: attempt.teacher_fluency_score,
      lexical: attempt.teacher_lexical_score,
      grammar: attempt.teacher_grammar_score,
      pronunciation: attempt.teacher_pronunciation_score,
      isReviewed: true,
      ...attempt,
    };
  }
  // Fallback to AI scores
  return { ...attempt, overall: attempt.overallScore, isReviewed: false };
};
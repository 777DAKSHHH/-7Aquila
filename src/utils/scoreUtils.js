export const isFacultyReviewed = (attempt) => {
  return (
    (attempt?.reviewed_at !== null && attempt?.reviewed_at !== undefined) ||
    (attempt?.teacher_band_score !== null && attempt?.teacher_band_score !== undefined) ||
    attempt?.status === 'reviewed'
  );
};

export const getDisplayedScore = (attempt) => {
  return isFacultyReviewed(attempt)
    ? attempt.teacher_band_score
    : attempt.overallScore;
};

export const getReviewBadge = (attempt) => {
  return isFacultyReviewed(attempt)
    ? 'Faculty Reviewed'
    : 'AI Evaluated';
};

export const getReviewColor = (attempt) => {
  return isFacultyReviewed(attempt)
    ? 'bg-primary/5'
    : '';
};

export const getAttemptScores = (attempt) => {
  if (isFacultyReviewed(attempt)) {
    return {
      ...attempt,
      overall: attempt.teacher_band_score,
      fluency: attempt.teacher_fluency_score,
      lexical: attempt.teacher_lexical_score,
      grammar: attempt.teacher_grammar_score,
      pronunciation: attempt.teacher_pronunciation_score,
      isReviewed: true,
    };
  }
  // Fallback to AI scores
  return { ...attempt, overall: attempt.overallScore, isReviewed: false };
};
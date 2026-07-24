/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * LISTENING SCORING SERVICE
 *
 * Handles deterministic grading of CBT IELTS Listening answers and
 * maps raw scores (0-40) to official IELTS Band Scores.
 * ==========================================================
 */

/**
 * Normalizes text input for string comparison.
 * Removes extra whitespaces, punctuation, and converts to lowercase.
 */
export const normalizeAnswer = (answer) => {
  if (answer === null || answer === undefined) return "";
  
  if (Array.isArray(answer)) {
    return answer.map(a => normalizeAnswer(a)).sort().filter(Boolean);
  }

  return String(answer)
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ") // Collapse multiple spaces to single space
    .replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, ""); // Strip punctuation for comparison safety
};

/**
 * Evaluates a user answer against the array of correct answers.
 * Returns true if the normalized user answer matches any normalized correct answer.
 */
export const checkAnswer = (userAnswer, correctAnswers) => {
  if (!correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    return false;
  }

  const normalizedUser = normalizeAnswer(userAnswer);

  if (Array.isArray(normalizedUser)) {
    const normalizedCorrect = correctAnswers.map(a => normalizeAnswer(a));
    if (normalizedUser.length !== normalizedCorrect.length) return false;
    return normalizedUser.every(val => normalizedCorrect.includes(val));
  }

  return correctAnswers.some(correct => {
    return normalizeAnswer(correct) === normalizedUser;
  });
};

/**
 * Maps Raw Listening Score (0-40) to IELTS Band Score (1.0 - 9.0)
 * Note: IELTS Listening raw-to-band mapping is identical for Academic and General.
 */
export const calculateListeningBand = (rawScore) => {
  const score = Math.max(0, Math.min(40, Math.round(rawScore)));

  if (score >= 39) return 9.0;
  if (score >= 37) return 8.5;
  if (score >= 35) return 8.0;
  if (score >= 32) return 7.5;
  if (score >= 30) return 7.0;
  if (score >= 26) return 6.5;
  if (score >= 23) return 6.0;
  if (score >= 18) return 5.5;
  if (score >= 15) return 5.0;
  if (score >= 13) return 4.5;
  if (score >= 10) return 4.0;
  if (score >= 8) return 3.5;
  if (score >= 6) return 3.0;
  if (score >= 4) return 2.5;
  if (score === 3) return 2.0;
  if (score === 2) return 1.5;
  if (score === 1) return 1.0;
  return 0.0;
};

/**
 * Grade Listening Test Session.
 * Evaluates the full session and returns detailed breakdown, raw score, and band score.
 */
export const scoreListeningSession = (userAnswers = {}, questions = []) => {
  if (!questions || questions.length === 0) {
    return {
      success: false,
      error: "No questions provided for evaluation."
    };
  }

  let rawScore = 0;
  const questionResults = [];

  const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);

  for (const q of sortedQuestions) {
    const qNumStr = String(q.question_number);
    const userAnswer = userAnswers[qNumStr];
    
    const isCorrect = checkAnswer(userAnswer, q.correct_answers);
    
    if (isCorrect) {
      rawScore += 1;
    }

    questionResults.push({
      questionId: q.id,
      questionNumber: q.question_number,
      questionType: q.question_type,
      userAnswer: userAnswer || null,
      correctAnswers: q.correct_answers,
      isCorrect,
      explanation: q.explanation || null
    });
  }

  const bandScore = calculateListeningBand(rawScore);

  return {
    success: true,
    rawScore,
    totalQuestions: sortedQuestions.length,
    bandScore,
    results: questionResults,
    evaluatedAt: new Date().toISOString()
  };
};

export const ListeningScoringService = {
  normalizeAnswer,
  checkAnswer,
  calculateListeningBand,
  scoreListeningSession
};

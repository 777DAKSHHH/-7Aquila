/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * READING SCORING SERVICE
 *
 * Handles deterministic grading of CBT IELTS Reading answers and
 * maps raw scores (0-40) to official IELTS Academic/General Band Scores.
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
    // Check if the user selected answers match all correct answers (order independent)
    if (normalizedUser.length !== normalizedCorrect.length) return false;
    return normalizedUser.every(val => normalizedCorrect.includes(val));
  }

  // Check if normalized user answer matches any of the accepted correct answers
  return correctAnswers.some(correct => {
    return normalizeAnswer(correct) === normalizedUser;
  });
};

/**
 * Maps Raw Reading Score (0-40) to IELTS Band Score (1.0 - 9.0)
 * Handles both Academic and General Training score tables.
 */
export const calculateReadingBand = (rawScore, testType = "academic") => {
  const score = Math.max(0, Math.min(40, Math.round(rawScore)));

  if (testType.toLowerCase() === "general") {
    // IELTS General Training Reading raw-to-band mapping
    if (score === 40) return 9.0;
    if (score === 39) return 8.5;
    if (score >= 37) return 8.0;
    if (score === 36) return 7.5;
    if (score >= 34) return 7.0;
    if (score >= 32) return 6.5;
    if (score >= 30) return 6.0;
    if (score >= 27) return 5.5;
    if (score >= 23) return 5.0;
    if (score >= 19) return 4.5;
    if (score >= 15) return 4.0;
    if (score >= 12) return 3.5;
    if (score >= 9) return 3.0;
    if (score >= 6) return 2.5;
    if (score >= 4) return 2.0;
    if (score >= 3) return 1.5;
    if (score >= 1) return 1.0;
    return 0.0;
  } else {
    // IELTS Academic Reading raw-to-band mapping
    if (score >= 39) return 9.0;
    if (score >= 37) return 8.5;
    if (score >= 35) return 8.0;
    if (score >= 33) return 7.5;
    if (score >= 30) return 7.0;
    if (score >= 27) return 6.5;
    if (score >= 23) return 6.0;
    if (score >= 20) return 5.5;
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
  }
};

/**
 * Grade Reading Test Session.
 * Evaluates the full session and returns detailed breakdown, raw score, and band score.
 *
 * @param {Object} userAnswers - Mapping of question_number -> user_answer string/array
 * @param {Array} questions - Array of questions matching the reading test
 * @param {string} testType - 'academic' or 'general'
 */
export const scoreReadingSession = (userAnswers = {}, questions = [], testType = "academic") => {
  if (!questions || questions.length === 0) {
    return {
      success: false,
      error: "No questions provided for evaluation."
    };
  }

  let rawScore = 0;
  const questionResults = [];

  // Loop through questions sorted by question number
  const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);

  for (const q of sortedQuestions) {
    const qNumStr = String(q.question_number);
    const userAnswer = userAnswers[qNumStr]; // Retrieve user response
    
    // Evaluate correctness
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
      explanation: q.explanation || null,
      citationExcerpt: q.citation_excerpt || null
    });
  }

  const bandScore = calculateReadingBand(rawScore, testType);

  return {
    success: true,
    rawScore,
    totalQuestions: sortedQuestions.length,
    bandScore,
    testType,
    results: questionResults,
    evaluatedAt: new Date().toISOString()
  };
};

export const ReadingScoringService = {
  normalizeAnswer,
  checkAnswer,
  calculateReadingBand,
  scoreReadingSession
};

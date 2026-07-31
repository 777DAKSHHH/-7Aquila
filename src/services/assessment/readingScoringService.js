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
 */
export const matchSingleAnswer = (userAns, correctAns) => {
  if (userAns === null || userAns === undefined || correctAns === null || correctAns === undefined) return false;

  const u = String(userAns).trim().toLowerCase();
  const c = String(correctAns).trim().toLowerCase();

  if (u === c) return true;

  // Normalize by stripping punctuation and collapse whitespaces
  const cleanU = u.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").trim();
  const cleanC = c.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]/g, "").replace(/\s+/g, " ").trim();

  if (cleanU === cleanC) return true;

  // Escape special regex chars helper
  const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

  // Check if correct answer is a single letter or roman numeral prefix
  // e.g. correct is "ii", user answer is "ii. the limits..."
  const prefixRegex = new RegExp(`^${escapeRegExp(cleanC)}(?:[^a-z0-9]|$)`);
  if (prefixRegex.test(cleanU)) {
    return true;
  }

  // Check reverse prefix mapping (e.g. correct is "ii. the limits...", user typed "ii")
  const revPrefixRegex = new RegExp(`^${escapeRegExp(cleanU)}(?:[^a-z0-9]|$)`);
  if (revPrefixRegex.test(cleanC)) {
    return true;
  }

  return false;
};

/**
 * Evaluates a user answer against the array of correct answers.
 */
export const checkAnswer = (userAnswer, correctAnswers) => {
  if (!correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    return false;
  }

  if (Array.isArray(userAnswer)) {
    if (userAnswer.length !== correctAnswers.length) return false;
    return userAnswer.every(val => {
      return correctAnswers.some(correct => matchSingleAnswer(val, correct));
    });
  }

  return correctAnswers.some(correct => {
    return matchSingleAnswer(userAnswer, correct);
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
  const evaluatedQuestions = {};

  const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);

  // Group questions by section and shared correct_answers list (only if it has length > 1)
  const groupedQuestionsMap = {};
  const ungroupedQuestions = [];

  for (const q of sortedQuestions) {
    if (q.correct_answers && Array.isArray(q.correct_answers) && q.correct_answers.length > 1) {
      const sortedKeys = [...q.correct_answers].map(a => String(a).toLowerCase().trim()).sort();
      const sectionKey = q.passage_id || q.section_id;
      const groupKey = `${sectionKey}_${JSON.stringify(sortedKeys)}`;
      
      if (!groupedQuestionsMap[groupKey]) {
        groupedQuestionsMap[groupKey] = [];
      }
      groupedQuestionsMap[groupKey].push(q);
    } else {
      ungroupedQuestions.push(q);
    }
  }

  // 1. Process Grouped Questions (MCQs that can be in either order)
  for (const groupKey in groupedQuestionsMap) {
    const groupQs = groupedQuestionsMap[groupKey];
    const N = groupQs.length;
    
    // Correct answers set (normalized)
    const firstQ = groupQs[0];
    const correctSet = new Set(
      firstQ.correct_answers.map(a => String(a).trim().toLowerCase())
    );

    // Collect all unique user selections for this group
    const userSelections = new Set();
    groupQs.forEach(q => {
      const qNumStr = String(q.question_number);
      const ans = userAnswers[qNumStr];
      if (ans) {
        if (Array.isArray(ans)) {
          ans.forEach(val => {
            if (val) userSelections.add(String(val).trim().toLowerCase());
          });
        } else {
          const parts = String(ans).split(",");
          parts.forEach(part => {
            if (part) userSelections.add(part.trim().toLowerCase());
          });
        }
      }
    });

    // Calculate how many correct selections matches
    let matches = 0;
    userSelections.forEach(sel => {
      const isMatched = Array.from(correctSet).some(correctVal => matchSingleAnswer(sel, correctVal));
      if (isMatched) {
        matches++;
      }
    });

    const scoreForGroup = Math.min(N, matches);
    rawScore += scoreForGroup;

    // Distribute correct/incorrect marks (first scoreForGroup questions marked true)
    for (let i = 0; i < N; i++) {
      const q = groupQs[i];
      const qNumStr = String(q.question_number);
      const isCorrect = i < scoreForGroup;
      
      evaluatedQuestions[q.id] = {
        questionId: q.id,
        questionNumber: q.question_number,
        questionType: q.question_type,
        userAnswer: userAnswers[qNumStr] || null,
        correctAnswers: q.correct_answers,
        isCorrect,
        explanation: q.explanation || null,
        citationExcerpt: q.citation_excerpt || null,
        questionData: q.question_data || null
      };
    }
  }

  // 2. Process Ungrouped Questions
  for (const q of ungroupedQuestions) {
    const qNumStr = String(q.question_number);
    const userAnswer = userAnswers[qNumStr];
    
    let isCorrect = false;
    if (q.correct_answers && q.correct_answers.length > 0) {
      const normalizedUserList = [];
      if (Array.isArray(userAnswer)) {
        userAnswer.forEach(val => {
          if (val) normalizedUserList.push(val);
        });
      } else if (userAnswer) {
        const parts = String(userAnswer).split(",");
        parts.forEach(part => {
          if (part) normalizedUserList.push(part);
        });
      }

      if (normalizedUserList.length > 0) {
        isCorrect = normalizedUserList.some(userVal => {
          return q.correct_answers.some(correctVal => matchSingleAnswer(userVal, correctVal));
        });
      }
    }

    if (isCorrect) {
      rawScore += 1;
    }

    evaluatedQuestions[q.id] = {
      questionId: q.id,
      questionNumber: q.question_number,
      questionType: q.question_type,
      userAnswer: userAnswer || null,
      correctAnswers: q.correct_answers,
      isCorrect,
      explanation: q.explanation || null,
      citationExcerpt: q.citation_excerpt || null,
      questionData: q.question_data || null
    };
  }

  // Populate results array in sorted order
  for (const q of sortedQuestions) {
    questionResults.push(evaluatedQuestions[q.id]);
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

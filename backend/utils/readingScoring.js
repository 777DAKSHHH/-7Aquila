/**
 * ==========================================================
 * ROCKET BACKEND UTILS - READING SCORING ENGINE
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

  let clean = String(answer).trim();

  // Unicode normalization (NFC/NFKC)
  clean = clean.normalize("NFKC");

  // Normalize quotes (smart quotes -> normal quotes)
  clean = clean.replace(/[\u2018\u2019\u201B\u2039\u203A]/g, "'"); // single smart quotes
  clean = clean.replace(/[\u201C\u201D\u201F\u00AB\u00BB]/g, '"'); // double smart quotes

  // Ignore capitalization
  clean = clean.toLowerCase();

  // Normalize hyphens (replace smart/em/en dashes with standard hyphen or space)
  clean = clean.replace(/[\u2010\u2011\u2012\u2013\u2014\u2015]/g, "-");

  // Collapse multiple spaces into one
  clean = clean.replace(/\s+/g, " ");

  // Remove accidental trailing punctuation (like trailing periods or commas, except if it is part of a decimal or standard symbol)
  clean = clean.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()]+$/, "");

  return clean.trim();
};

export const splitAlternatives = (correctAnsString) => {
  if (!correctAnsString) return [];
  const str = String(correctAnsString).trim();
  
  // Protect "and/or" from being split by the slash
  const andOrPlaceholder = "___AND_OR_PLACEHOLDER___";
  const protectedStr = str.replace(/and\/or/gi, andOrPlaceholder);

  // Split by: OR, or, /, |, ;
  const splitRegex = /\s+(?:or|OR)\s+|\s*[/|;]\s*/g;
  const parts = protectedStr.split(splitRegex);

  return parts
    .map(p => p.replace(new RegExp(andOrPlaceholder, "g"), "and/or").trim())
    .filter(Boolean);
};

export const validateWordLimit = (userAns, instructionText) => {
  if (!instructionText) return true;
  const text = String(instructionText).toLowerCase();
  
  let maxWords = null;
  let maxNumbers = null;
  
  if (text.includes("one word only")) {
    maxWords = 1;
    maxNumbers = 0;
  } else if (text.includes("one word and/or a number") || text.includes("one word or a number")) {
    maxWords = 1;
    maxNumbers = 1;
  } else if (text.includes("no more than two words and/or a number")) {
    maxWords = 2;
    maxNumbers = 1;
  } else if (text.includes("no more than two words")) {
    maxWords = 2;
    maxNumbers = 0;
  } else if (text.includes("no more than three words and/or a number")) {
    maxWords = 3;
    maxNumbers = 1;
  } else if (text.includes("no more than three words")) {
    maxWords = 3;
    maxNumbers = 0;
  }

  if (maxWords === null) return true;

  const clean = String(userAns).trim();
  if (!clean) return true;

  const tokens = clean.split(/\s+/).filter(Boolean);
  
  let wordsCount = 0;
  let numbersCount = 0;

  for (const token of tokens) {
    const normalizedToken = token.replace(/[^0-9.,]/g, "");
    const isNumber = normalizedToken.length > 0 && /^\d+(?:[.,]\d+)?$/.test(normalizedToken);
    if (isNumber) {
      numbersCount++;
    } else {
      wordsCount++;
    }
  }

  if (maxWords > 0 && maxNumbers === 0) {
    if (numbersCount > 0) return false;
    if (wordsCount > maxWords) return false;
  } else if (maxWords > 0 && maxNumbers > 0) {
    if (wordsCount > maxWords || numbersCount > maxNumbers) return false;
    if (wordsCount + numbersCount > maxWords + maxNumbers) return false;
  }

  return true;
};

/**
 * Evaluates a user answer against the array of correct answers.
 */
export const matchSingleAnswer = (userAns, correctAns, instructionText = "", questionType = "") => {
  if (userAns === null || userAns === undefined || correctAns === null || correctAns === undefined) return false;

  // Word limits on text entry question types
  const textEntryTypes = ["sentence_completion", "summary_completion", "table_completion", "short_answer", "form_completion", "flow_chart", "note_completion", "diagram_labeling"];
  if (questionType && textEntryTypes.includes(questionType)) {
    if (!validateWordLimit(userAns, instructionText)) {
      return false;
    }
  }

  const correctAlternatives = splitAlternatives(correctAns);
  const normalizedUser = normalizeAnswer(userAns);

  return correctAlternatives.some(alt => {
    const normalizedAlt = normalizeAnswer(alt);

    if (normalizedUser === normalizedAlt) return true;

    // Normalize hyphens where Cambridge permits
    const hyphenU = normalizedUser.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    const hyphenC = normalizedAlt.replace(/-/g, " ").replace(/\s+/g, " ").trim();
    if (hyphenU === hyphenC) return true;

    const stripHyphenU = normalizedUser.replace(/[-\s]/g, "");
    const stripHyphenC = normalizedAlt.replace(/[-\s]/g, "");
    if (stripHyphenU === stripHyphenC) return true;

    // Prefix matching for MCQ/Matching headings/etc.
    const mcqOrMatchingTypes = ["mcq_single", "mcq_multiple", "matching", "matching_headings", "matching_info", "matching_features", "matching_endings", "matching_sentence_endings", "map", "plan", "diagram"];
    if (!questionType || mcqOrMatchingTypes.includes(questionType)) {
      const escapeRegExp = (str) => str.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      const prefixRegex = new RegExp(`^${escapeRegExp(normalizedAlt)}(?:[^a-z0-9]|$)`);
      if (prefixRegex.test(normalizedUser)) return true;

      const revPrefixRegex = new RegExp(`^${escapeRegExp(normalizedUser)}(?:[^a-z0-9]|$)`);
      if (revPrefixRegex.test(normalizedAlt)) return true;
    }

    return false;
  });
};

/**
 * Evaluates a user answer against the array of correct answers.
 */
export const checkAnswer = (userAnswer, correctAnswers, instructionText = "", questionType = "") => {
  if (!correctAnswers || !Array.isArray(correctAnswers) || correctAnswers.length === 0) {
    return false;
  }

  if (Array.isArray(userAnswer)) {
    if (userAnswer.length !== correctAnswers.length) return false;
    return userAnswer.every(val => {
      return correctAnswers.some(correct => matchSingleAnswer(val, correct, instructionText, questionType));
    });
  }

  return correctAnswers.some(correct => {
    return matchSingleAnswer(userAnswer, correct, instructionText, questionType);
  });
};

/**
 * Maps Raw Reading Score (0-40) to IELTS Band Score (1.0 - 9.0)
 * Handles both Academic and General Training score tables.
 */
export const calculateReadingBand = (rawScore, testType = "academic") => {
  const score = Math.max(0, Math.min(40, Math.round(rawScore)));

  if (testType.toLowerCase() === "general") {
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

  const groupedQuestionsMap = {};
  const ungroupedQuestions = [];

  for (const q of sortedQuestions) {
    if (q.correct_answers && Array.isArray(q.correct_answers) && q.correct_answers.length > 1) {
      const sortedKeys = [...q.correct_answers].map(a => String(a).toLowerCase().trim()).sort();
      const sectionKey = q.passage_id || q.section_id;
      const optionsHash = JSON.stringify(q.question_data?.options || []);
      const groupKey = `${sectionKey}_${JSON.stringify(sortedKeys)}_${optionsHash}`;
      
      if (!groupedQuestionsMap[groupKey]) {
        groupedQuestionsMap[groupKey] = [];
      }
      groupedQuestionsMap[groupKey].push(q);
    } else {
      ungroupedQuestions.push(q);
    }
  }

  // Filter out groups of size 1 (which are single questions with alternative answers)
  const finalGroupedQuestionsMap = {};
  for (const key in groupedQuestionsMap) {
    if (groupedQuestionsMap[key].length > 1) {
      finalGroupedQuestionsMap[key] = groupedQuestionsMap[key];
    } else {
      ungroupedQuestions.push(groupedQuestionsMap[key][0]);
    }
  }

  // 1. Process Grouped Questions (MCQs that can be in either order)
  for (const groupKey in finalGroupedQuestionsMap) {
    const groupQs = finalGroupedQuestionsMap[groupKey];
    const N = groupQs.length;
    
    const firstQ = groupQs[0];
    const correctOptions = [...firstQ.correct_answers];

    const matchedCorrectIndices = new Set();
    const questionResultsList = [];

    for (let i = 0; i < N; i++) {
      const q = groupQs[i];
      const qNumStr = String(q.question_number);
      const userAnsRaw = userAnswers[qNumStr];
      
      let matchedIndex = -1;
      if (userAnsRaw) {
        // Find an unmatched correct option that matches the user answer
        for (let j = 0; j < correctOptions.length; j++) {
          if (!matchedCorrectIndices.has(j)) {
            const correctVal = correctOptions[j];
            if (matchSingleAnswer(userAnsRaw, correctVal, q.instruction_text, q.question_type)) {
              matchedIndex = j;
              break;
            }
          }
        }
      }
      
      if (matchedIndex !== -1) {
        matchedCorrectIndices.add(matchedIndex);
        rawScore += 1;
        questionResultsList.push({ q, userAnswer: userAnsRaw, isCorrect: true });
      } else {
        questionResultsList.push({ q, userAnswer: userAnsRaw, isCorrect: false });
      }
    }

    for (const res of questionResultsList) {
      evaluatedQuestions[res.q.id] = {
        questionId: res.q.id,
        questionNumber: res.q.question_number,
        questionType: res.q.question_type,
        userAnswer: res.userAnswer || null,
        correctAnswers: res.q.correct_answers,
        isCorrect: res.isCorrect,
        explanation: res.q.explanation || null,
        citationExcerpt: res.q.citation_excerpt || null,
        questionData: res.q.question_data || null
      };
    }
  }

  // 2. Process Ungrouped Questions
  for (const q of ungroupedQuestions) {
    const qNumStr = String(q.question_number);
    const userAnswer = userAnswers[qNumStr];
    
    let isCorrect = false;
    if (q.correct_answers && q.correct_answers.length > 0) {
      isCorrect = checkAnswer(userAnswer, q.correct_answers, q.instruction_text, q.question_type);
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

export const ReadingScoring = {
  normalizeAnswer,
  checkAnswer,
  calculateReadingBand,
  scoreReadingSession
};

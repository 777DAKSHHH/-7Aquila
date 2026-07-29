import { supabase } from "../config/supabaseClient.js";
import { ReadingScoring } from "../utils/readingScoring.js";

/**
 * Fetch all active reading tests with optional filters
 */
export const getReadingTests = async (req, res) => {
  try {
    const { testType, difficulty } = req.query;

    let query = supabase
      .from("reading_tests")
      .select(`
        id,
        title,
        test_type,
        difficulty,
        duration_minutes,
        test_set_id,
        test_sets (
          id,
          name,
          description,
          set_number
        )
      `)
      .eq("is_active", true);

    if (testType && testType !== "all") {
      query = query.eq("test_type", testType);
    }

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(200).json({
      success: true,
      tests: data
    });
  } catch (err) {
    console.error("getReadingTests error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Fetch test details, passages and questions
 */
export const getReadingTestDetails = async (req, res) => {
  try {
    const { testId } = req.params;

    if (!testId) {
      return res.status(400).json({
        success: false,
        message: "testId parameter is required"
      });
    }

    // 1. Fetch test basic metadata
    const { data: testData, error: testError } = await supabase
      .from("reading_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError) {
      return res.status(400).json({
        success: false,
        message: testError.message
      });
    }

    // 2. Fetch passages and questions
    const { data: passagesData, error: passagesError } = await supabase
      .from("reading_passages")
      .select(`
        *,
        questions: reading_questions (
          *
        )
      `)
      .eq("reading_test_id", testId)
      .order("passage_number", { ascending: true });

    if (passagesError) {
      return res.status(400).json({
        success: false,
        message: passagesError.message
      });
    }

    // Sort nested questions by question number
    const passagesWithSortedQuestions = passagesData.map(p => {
      const sortedQuestions = (p.questions || []).sort((a, b) => a.question_number - b.question_number);
      return {
        ...p,
        questions: sortedQuestions
      };
    });

    return res.status(200).json({
      success: true,
      test: testData,
      passages: passagesWithSortedQuestions
    });
  } catch (err) {
    console.error("getReadingTestDetails error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Initialize a reading session (draft)
 */
export const createReadingSession = async (req, res) => {
  try {
    const { studentId, readingTestId } = req.body;

    if (!studentId || !readingTestId) {
      return res.status(400).json({
        success: false,
        message: "studentId and readingTestId are required"
      });
    }

    const payload = {
      student_id: studentId,
      reading_test_id: readingTestId,
      status: "draft",
      user_answers: {},
      flagged_questions: [],
      time_spent_seconds: 0
    };

    const { data, error } = await supabase
      .from("reading_sessions")
      .insert(payload)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(201).json({
      success: true,
      session: data
    });
  } catch (err) {
    console.error("createReadingSession error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Save draft progress
 */
export const saveReadingDraft = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswers, flaggedQuestions, timeSpentSeconds } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    const payload = {
      user_answers: userAnswers || {},
      flagged_questions: flaggedQuestions || [],
      time_spent_seconds: timeSpentSeconds || 0,
      status: "in_progress",
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("reading_sessions")
      .update(payload)
      .eq("id", sessionId)
      .select()
      .single();

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }

    return res.status(200).json({
      success: true,
      session: data
    });
  } catch (err) {
    console.error("saveReadingDraft error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Submit and grade session
 */
export const submitReadingSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswers, flaggedQuestions, timeSpentSeconds, testType } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    // 1. Fetch reading session to find testId
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from("reading_sessions")
      .select("reading_test_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError) {
      return res.status(400).json({
        success: false,
        message: sessionFetchError.message
      });
    }

    // 2. Fetch all questions for grading
    const { data: passages, error: passagesError } = await supabase
      .from("reading_passages")
      .select(`
        id,
        questions: reading_questions (
          id,
          passage_id,
          question_number,
          question_type,
          correct_answers,
          explanation,
          citation_excerpt
        )
      `)
      .eq("reading_test_id", sessionData.reading_test_id);

    if (passagesError) {
      return res.status(400).json({
        success: false,
        message: passagesError.message
      });
    }

    const allQuestions = passages.flatMap(p => p.questions || []);

    // 3. Score the session
    const grading = ReadingScoring.scoreReadingSession(
      userAnswers || {},
      allQuestions,
      testType || "academic"
    );

    if (!grading.success) {
      return res.status(400).json({
        success: false,
        message: grading.error || "Grading calculation failed."
      });
    }

    // 4. Update session
    const payload = {
      user_answers: userAnswers || {},
      flagged_questions: flaggedQuestions || [],
      time_spent_seconds: timeSpentSeconds || 0,
      status: "completed",
      raw_score: grading.rawScore,
      band_score: grading.bandScore,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data: updatedSession, error: updateError } = await supabase
      .from("reading_sessions")
      .update(payload)
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) {
      return res.status(400).json({
        success: false,
        message: updateError.message
      });
    }

    return res.status(200).json({
      success: true,
      session: updatedSession,
      grading
    });
  } catch (err) {
    console.error("submitReadingSession error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

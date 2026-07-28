import { supabase } from "../config/supabaseClient.js";
import { ListeningScoring } from "../utils/listeningScoring.js";

/**
 * Fetch all active listening tests with optional filters
 */
export const getListeningTests = async (req, res) => {
  try {
    const { difficulty } = req.query;

    let query = supabase
      .from("listening_tests")
      .select(`
        id,
        title,
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
    console.error("getListeningTests error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Fetch test details, sections and nested questions
 */
export const getListeningTestDetails = async (req, res) => {
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
      .from("listening_tests")
      .select("*")
      .eq("id", testId)
      .single();

    if (testError) {
      return res.status(400).json({
        success: false,
        message: testError.message
      });
    }

    // 2. Fetch sections and nested questions
    const { data: sectionsData, error: sectionsError } = await supabase
      .from("listening_sections")
      .select(`
        *,
        questions: listening_questions (
          *
        )
      `)
      .eq("listening_test_id", testId)
      .order("section_number", { ascending: true });

    if (sectionsError) {
      return res.status(400).json({
        success: false,
        message: sectionsError.message
      });
    }

    // Sort nested questions by question number
    const sectionsWithSortedQuestions = sectionsData.map(s => {
      const sortedQuestions = (s.questions || []).sort((a, b) => a.question_number - b.question_number);
      return {
        ...s,
        questions: sortedQuestions
      };
    });

    return res.status(200).json({
      success: true,
      test: testData,
      sections: sectionsWithSortedQuestions
    });
  } catch (err) {
    console.error("getListeningTestDetails error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Initialize a listening session (draft)
 */
export const createListeningSession = async (req, res) => {
  try {
    const { studentId, listeningTestId } = req.body;

    if (!studentId || !listeningTestId) {
      return res.status(400).json({
        success: false,
        message: "studentId and listeningTestId are required"
      });
    }

    const payload = {
      student_id: studentId,
      listening_test_id: listeningTestId,
      status: "draft",
      user_answers: {},
      flagged_questions: [],
      time_spent_seconds: 0
    };

    const { data, error } = await supabase
      .from("listening_sessions")
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
    console.error("createListeningSession error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Save draft progress
 */
export const saveListeningDraft = async (req, res) => {
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
      status: req.body.status || "in_progress",
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from("listening_sessions")
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
    console.error("saveListeningDraft error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

/**
 * Submit and grade session
 */
export const submitListeningSession = async (req, res) => {
  try {
    const { sessionId } = req.params;
    const { userAnswers, flaggedQuestions, timeSpentSeconds } = req.body;

    if (!sessionId) {
      return res.status(400).json({
        success: false,
        message: "sessionId is required"
      });
    }

    // 1. Fetch listening session to find testId
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from("listening_sessions")
      .select("listening_test_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError) {
      return res.status(400).json({
        success: false,
        message: sessionFetchError.message
      });
    }

    // 2. Fetch all questions for grading
    const { data: sections, error: sectionsError } = await supabase
      .from("listening_sections")
      .select(`
        id,
        questions: listening_questions (
          id,
          question_number,
          question_type,
          correct_answers,
          explanation
        )
      `)
      .eq("listening_test_id", sessionData.listening_test_id);

    if (sectionsError) {
      return res.status(400).json({
        success: false,
        message: sectionsError.message
      });
    }

    const allQuestions = sections.flatMap(s => s.questions || []);

    // 3. Score the session
    const grading = ListeningScoring.scoreListeningSession(
      userAnswers || {},
      allQuestions
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
      .from("listening_sessions")
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
    console.error("submitListeningSession error:", err);
    return res.status(500).json({
      success: false,
      message: "Server error"
    });
  }
};

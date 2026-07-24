/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * READING SERVICE
 *
 * Handles fetching reading tests, passages, questions,
 * student sessions, autosaving drafts, and submitting reading tests.
 * ==========================================================
 */

import { supabase } from "../../supabaseClient";
import { ReadingScoringService } from "./readingScoringService";

const TESTS_TABLE = "reading_tests";
const PASSAGES_TABLE = "reading_passages";
const SESSIONS_TABLE = "reading_sessions";

const successResponse = (data) => ({
  success: true,
  data,
  error: null
});

const errorResponse = (error) => ({
  success: false,
  data: null,
  error: error?.message || error
});

const logError = (location, error) => {
  console.error(`[Rocket Reading Service] ${location}:`, error);
};

/**
 * Fetch all active reading tests with optional filters
 */
export const getReadingTests = async (filters = {}) => {
  try {
    let query = supabase
      .from(TESTS_TABLE)
      .select(`
        id,
        title,
        test_type,
        difficulty,
        duration_minutes,
        test_set_id,
        test_sets (
          name,
          description,
          set_number
        ),
        reading_passages (
          id,
          passage_number,
          reading_questions (
            id
          )
        )
      `)
      .eq("is_active", true);

    if (filters.testType && filters.testType !== "all") {
      query = query.eq("test_type", filters.testType);
    }

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getReadingTests()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch full test details: Passages and questions for a specific reading test ID
 */
export const getReadingTestDetails = async (testId) => {
  try {
    // 1. Fetch test basic metadata
    const { data: testData, error: testError } = await supabase
      .from(TESTS_TABLE)
      .select("*")
      .eq("id", testId)
      .single();

    if (testError) throw testError;

    // 2. Fetch passages and nested questions
    const { data: passagesData, error: passagesError } = await supabase
      .from(PASSAGES_TABLE)
      .select(`
        *,
        questions: reading_questions (
          *
        )
      `)
      .eq("reading_test_id", testId)
      .order("passage_number", { ascending: true });

    if (passagesError) throw passagesError;

    // Sort nested questions by question number
    const passagesWithSortedQuestions = passagesData.map(p => {
      const sortedQuestions = (p.questions || []).sort((a, b) => a.question_number - b.question_number);
      return {
        ...p,
        questions: sortedQuestions
      };
    });

    return successResponse({
      test: testData,
      passages: passagesWithSortedQuestions
    });
  } catch (error) {
    logError("getReadingTestDetails()", error);
    return errorResponse(error);
  }
};

/**
 * Initialize a reading test session (draft)
 */
export const createReadingSession = async ({ studentId, readingTestId }) => {
  try {
    const payload = {
      student_id: studentId,
      reading_test_id: readingTestId,
      status: "draft",
      user_answers: {},
      flagged_questions: [],
      time_spent_seconds: 0
    };

    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .insert(payload)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("createReadingSession()", error);
    return errorResponse(error);
  }
};

/**
 * Retrieve a reading session
 */
export const getReadingSession = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select(`
        *,
        reading_tests (
          title,
          test_type,
          difficulty,
          duration_minutes
        )
      `)
      .eq("id", sessionId)
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getReadingSession()", error);
    return errorResponse(error);
  }
};

/**
 * Autosave student answers draft progress
 */
export const saveReadingDraft = async (sessionId, { userAnswers = {}, flaggedQuestions = [], timeSpentSeconds = 0 }) => {
  try {
    const payload = {
      user_answers: userAnswers,
      flagged_questions: flaggedQuestions,
      time_spent_seconds: timeSpentSeconds,
      status: "in_progress",
      updated_at: new Date().toISOString()
    };

    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .update(payload)
      .eq("id", sessionId)
      .select()
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("saveReadingDraft()", error);
    return errorResponse(error);
  }
};

/**
 * Submit and Grade a reading session.
 */
export const submitReadingSession = async (sessionId, { userAnswers = {}, flaggedQuestions = [], timeSpentSeconds = 0, testType = "academic" }) => {
  try {
    // 1. Fetch the reading session first to get testId
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from(SESSIONS_TABLE)
      .select("reading_test_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError) throw sessionFetchError;

    // 2. Fetch all questions for this reading test
    const { data: passages, error: passagesError } = await supabase
      .from(PASSAGES_TABLE)
      .select(`
        id,
        questions: reading_questions (
          id,
          question_number,
          question_type,
          correct_answers,
          explanation,
          citation_excerpt
        )
      `)
      .eq("reading_test_id", sessionData.reading_test_id);

    if (passagesError) throw passagesError;

    const allQuestions = passages.flatMap(p => p.questions || []);

    // 3. Score the session
    const grading = ReadingScoringService.scoreReadingSession(userAnswers, allQuestions, testType);

    if (!grading.success) {
      throw new Error(grading.error || "Grading failed.");
    }

    // 4. Update the reading session record
    const payload = {
      user_answers: userAnswers,
      flagged_questions: flaggedQuestions,
      time_spent_seconds: timeSpentSeconds,
      status: "completed",
      raw_score: grading.rawScore,
      band_score: grading.bandScore,
      completed_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    };

    const { data, error: updateError } = await supabase
      .from(SESSIONS_TABLE)
      .update(payload)
      .eq("id", sessionId)
      .select()
      .single();

    if (updateError) throw updateError;

    return successResponse({
      session: data,
      grading
    });
  } catch (error) {
    logError("submitReadingSession()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch complete results for a reading session including detailed grading
 */
export const getReadingSessionResults = async (sessionId) => {
  try {
    // 1. Fetch session
    const sessionRes = await getReadingSession(sessionId);
    if (!sessionRes.success) return sessionRes;
    const sessionData = sessionRes.data;

    // 2. Fetch test details (passages and questions)
    const testRes = await getReadingTestDetails(sessionData.reading_test_id);
    if (!testRes.success) return testRes;
    const { test, passages } = testRes.data;

    // 3. Compile all questions
    const allQuestions = passages.flatMap(p => p.questions || []);

    // 4. Grade the session
    const grading = ReadingScoringService.scoreReadingSession(
      sessionData.user_answers || {},
      allQuestions,
      test?.test_type || "academic"
    );

    return successResponse({
      session: sessionData,
      test,
      passages,
      grading
    });
  } catch (error) {
    logError("getReadingSessionResults()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch Student Reading History
 */
export const getStudentReadingHistory = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select(`
        *,
        reading_tests (
          title,
          test_type,
          difficulty
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getStudentReadingHistory()", error);
    return errorResponse(error);
  }
};

/**
 * Get Student Reading Statistics
 */
export const getReadingStatistics = async (studentId) => {
  try {
    const history = await getStudentReadingHistory(studentId);

    if (!history.success) {
      return history;
    }

    const sessions = history.data || [];
    const completed = sessions.filter(s => s.status === "completed");

    const averageBand = completed.length
      ? completed.reduce((sum, s) => sum + (Number(s.band_score) || 0), 0) / completed.length
      : 0;

    const averageRawScore = completed.length
      ? completed.reduce((sum, s) => sum + (Number(s.raw_score) || 0), 0) / completed.length
      : 0;

    return successResponse({
      totalSessions: sessions.length,
      completedSessions: completed.length,
      draftSessions: sessions.filter(s => s.status === "draft" || s.status === "in_progress").length,
      averageBand: Number(averageBand.toFixed(2)),
      averageRawScore: Number(averageRawScore.toFixed(1))
    });
  } catch (error) {
    logError("getReadingStatistics()", error);
    return errorResponse(error);
  }
};

export const ReadingService = {
  getReadingTests,
  getReadingTestDetails,
  createReadingSession,
  getReadingSession,
  saveReadingDraft,
  submitReadingSession,
  getReadingSessionResults,
  getStudentReadingHistory,
  getReadingStatistics
};

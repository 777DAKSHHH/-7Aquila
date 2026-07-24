/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * LISTENING SERVICE
 *
 * Handles fetching listening tests, sections, questions,
 * student sessions, autosaving drafts, and submitting listening tests.
 * ==========================================================
 */

import { supabase } from "../../supabaseClient";
import { ListeningScoringService } from "./listeningScoringService";

const TESTS_TABLE = "listening_tests";
const SECTIONS_TABLE = "listening_sections";
const SESSIONS_TABLE = "listening_sessions";

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
  console.error(`[Rocket Listening Service] ${location}:`, error);
};

/**
 * Fetch all active listening tests with optional filters
 */
export const getListeningTests = async (filters = {}) => {
  try {
    let query = supabase
      .from(TESTS_TABLE)
      .select(`
        id,
        title,
        difficulty,
        duration_minutes,
        test_set_id,
        test_sets (
          name,
          description,
          set_number
        ),
        listening_sections (
          id,
          section_number,
          listening_questions (
            id
          )
        )
      `)
      .eq("is_active", true);

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    const { data, error } = await query.order("created_at", { ascending: false });

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getListeningTests()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch full test details: Sections and questions for a specific listening test ID
 */
export const getListeningTestDetails = async (testId) => {
  try {
    // 1. Fetch test basic metadata
    const { data: testData, error: testError } = await supabase
      .from(TESTS_TABLE)
      .select("*")
      .eq("id", testId)
      .single();

    if (testError) throw testError;

    // 2. Fetch sections and nested questions
    const { data: sectionsData, error: sectionsError } = await supabase
      .from(SECTIONS_TABLE)
      .select(`
        *,
        questions: listening_questions (
          *
        )
      `)
      .eq("listening_test_id", testId)
      .order("section_number", { ascending: true });

    if (sectionsError) throw sectionsError;

    // Sort nested questions by question number
    const sectionsWithSortedQuestions = sectionsData.map(s => {
      const sortedQuestions = (s.questions || []).sort((a, b) => a.question_number - b.question_number);
      return {
        ...s,
        questions: sortedQuestions
      };
    });

    return successResponse({
      test: testData,
      sections: sectionsWithSortedQuestions
    });
  } catch (error) {
    logError("getListeningTestDetails()", error);
    return errorResponse(error);
  }
};

/**
 * Initialize a listening test session (draft)
 */
export const createListeningSession = async ({ studentId, listeningTestId }) => {
  try {
    const payload = {
      student_id: studentId,
      listening_test_id: listeningTestId,
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
    logError("createListeningSession()", error);
    return errorResponse(error);
  }
};

/**
 * Retrieve a listening session
 */
export const getListeningSession = async (sessionId) => {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select(`
        *,
        listening_tests (
          title,
          difficulty,
          duration_minutes
        )
      `)
      .eq("id", sessionId)
      .single();

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getListeningSession()", error);
    return errorResponse(error);
  }
};

/**
 * Autosave student answers draft progress
 */
export const saveListeningDraft = async (sessionId, { userAnswers = {}, flaggedQuestions = [], timeSpentSeconds = 0 }) => {
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
    logError("saveListeningDraft()", error);
    return errorResponse(error);
  }
};

/**
 * Submit and Grade a listening session.
 */
export const submitListeningSession = async (sessionId, { userAnswers = {}, flaggedQuestions = [], timeSpentSeconds = 0 }) => {
  try {
    // 1. Fetch the listening session first to get testId
    const { data: sessionData, error: sessionFetchError } = await supabase
      .from(SESSIONS_TABLE)
      .select("listening_test_id")
      .eq("id", sessionId)
      .single();

    if (sessionFetchError) throw sessionFetchError;

    // 2. Fetch all questions for this listening test
    const { data: sections, error: sectionsError } = await supabase
      .from(SECTIONS_TABLE)
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

    if (sectionsError) throw sectionsError;

    const allQuestions = sections.flatMap(s => s.questions || []);

    // 3. Score the session
    const grading = ListeningScoringService.scoreListeningSession(userAnswers, allQuestions);

    if (!grading.success) {
      throw new Error(grading.error || "Grading failed.");
    }

    // 4. Update the listening session record
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
    logError("submitListeningSession()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch complete results for a listening session including detailed grading
 */
export const getListeningSessionResults = async (sessionId) => {
  try {
    // 1. Fetch session
    const sessionRes = await getListeningSession(sessionId);
    if (!sessionRes.success) return sessionRes;
    const sessionData = sessionRes.data;

    // 2. Fetch test details (sections and questions)
    const testRes = await getListeningTestDetails(sessionData.listening_test_id);
    if (!testRes.success) return testRes;
    const { test, sections } = testRes.data;

    // 3. Compile all questions
    const allQuestions = sections.flatMap(s => s.questions || []);

    // 4. Grade the session
    const grading = ListeningScoringService.scoreListeningSession(
      sessionData.user_answers || {},
      allQuestions
    );

    return successResponse({
      session: sessionData,
      test,
      sections,
      grading
    });
  } catch (error) {
    logError("getListeningSessionResults()", error);
    return errorResponse(error);
  }
};

/**
 * Fetch Student Listening History
 */
export const getStudentListeningHistory = async (studentId) => {
  try {
    const { data, error } = await supabase
      .from(SESSIONS_TABLE)
      .select(`
        *,
        listening_tests (
          title,
          difficulty
        )
      `)
      .eq("student_id", studentId)
      .order("created_at", { ascending: false });

    if (error) throw error;

    return successResponse(data);
  } catch (error) {
    logError("getStudentListeningHistory()", error);
    return errorResponse(error);
  }
};

/**
 * Get Student Listening Statistics
 */
export const getListeningStatistics = async (studentId) => {
  try {
    const history = await getStudentListeningHistory(studentId);

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
    logError("getListeningStatistics()", error);
    return errorResponse(error);
  }
};

export const ListeningService = {
  getListeningTests,
  getListeningTestDetails,
  createListeningSession,
  getListeningSession,
  saveListeningDraft,
  submitListeningSession,
  getListeningSessionResults,
  getStudentListeningHistory,
  getListeningStatistics
};

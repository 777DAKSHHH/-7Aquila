import { supabase } from "../../supabaseClient";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 * Question Service
 * ----------------------------------------------------------
 * Handles fetching questions for:
 * - Writing
 * - Reading
 * - Listening
 * - Speaking (future migration)
 * ==========================================================
 */

// Mapping between module keys and Supabase tables
const QUESTION_TABLES = {
  writing_task1: "writing_task1_questions",
  writing_task2: "writing_task2_questions",
  reading: "reading_passages",
  listening: "listening_tests",
  speaking: "speaking_questions",
};

// Storage bucket
const STORAGE_BUCKET = "rocket-assets";

/**
 * Get all active questions matching optional filters
 */
export const getQuestions = async (module, filters = {}) => {
  try {
    const table = QUESTION_TABLES[module];

    if (!table) {
      throw new Error(`Unknown module: ${module}`);
    }

    let query = supabase
      .from(table)
      .select("*")
      .eq("is_active", true)
      .order("display_order", {
        ascending: true,
      });

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.question_type && filters.question_type !== "all") {
      query = query.eq("question_type", filters.question_type);
    }

    const { data, error } = await query;

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Question Service (getQuestions):", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Get question statistics for Writing Task 1
 */
export const getWritingTask1Stats = async () => {
  try {
    const table = QUESTION_TABLES[module_table_task1()];

    const { data, error } = await supabase
      .from(table)
      .select("id, question_type, is_active");

    if (error) throw error;

    const totalQuestions = data ? data.length : 0;
    const activeQuestions = data ? data.filter((q) => q.is_active) : [];
    const totalActive = activeQuestions.length;

    const distinctTypes = [
      ...new Set(activeQuestions.map((q) => q.question_type).filter(Boolean)),
    ];

    return {
      success: true,
      data: {
        totalQuestions,
        totalActive,
        distinctTypesCount: distinctTypes.length,
        questionTypes: distinctTypes,
      },
    };
  } catch (err) {
    console.error("Question Service (getWritingTask1Stats):", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

const module_table_task1 = () => QUESTION_TABLES.writing_task1;

/**
 * Get count of active questions matching given filters
 */
export const getFilteredQuestionsCount = async (module, filters = {}) => {
  try {
    const table = QUESTION_TABLES[module];
    if (!table) throw new Error(`Unknown module: ${module}`);

    let query = supabase
      .from(table)
      .select("id", { count: "exact", head: true })
      .eq("is_active", true);

    if (filters.difficulty && filters.difficulty !== "all") {
      query = query.eq("difficulty", filters.difficulty);
    }

    if (filters.question_type && filters.question_type !== "all") {
      query = query.eq("question_type", filters.question_type);
    }

    const { count, error } = await query;
    if (error) throw error;

    return {
      success: true,
      count: count || 0,
    };
  } catch (err) {
    console.error("Question Service (getFilteredQuestionsCount):", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Get question by primary key UUID (id)
 */
export const getQuestionById = async (module, questionId) => {
  try {
    const table = QUESTION_TABLES[module];

    if (!table) {
      throw new Error(`Unknown module: ${module}`);
    }

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("id", questionId)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Question Service (getQuestionById):", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Get question by code (e.g. WT-0001)
 */
export const getQuestionByCode = async (module, questionCode) => {
  try {
    const table = QUESTION_TABLES[module];

    const { data, error } = await supabase
      .from(table)
      .select("*")
      .eq("question_code", questionCode)
      .single();

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error("Question Service (getQuestionByCode):", err);

    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Random Question matching filters
 */
export const getRandomQuestion = async (module, filters = {}) => {
  const result = await getQuestions(module, filters);

  if (!result.success) {
    return result;
  }

  const questions = result.data;

  if (!questions || !questions.length) {
    return {
      success: false,
      error: "No matching questions found for the selected filters.",
    };
  }

  const randomIndex = Math.floor(Math.random() * questions.length);

  return {
    success: true,
    data: questions[randomIndex],
  };
};

/**
 * Convert Storage Path into Public URL
 */
export const getQuestionImage = (imagePath) => {
  if (!imagePath) return null;

  const { data } = supabase.storage
    .from(STORAGE_BUCKET)
    .getPublicUrl(imagePath);

  return data.publicUrl;
};

/**
 * ==========================================================
 * QUESTION SERVICE EXPORT
 * ==========================================================
 */
export const QuestionService = {
  getQuestions,
  getWritingTask1Stats,
  getFilteredQuestionsCount,
  getQuestionById,
  getQuestionByCode,
  getRandomQuestion,
  getQuestionImage,
};
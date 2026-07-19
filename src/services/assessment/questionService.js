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
 * Get all active questions
 */
export const getQuestions = async (
  module,
  filters = {}
) => {
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

    if (filters.difficulty) {
      query = query.eq(
        "difficulty",
        filters.difficulty
      );
    }

    if (filters.question_type) {
      query = query.eq(
        "question_type",
        filters.question_type
      );
    }

    const { data, error } =
      await query;

    if (error) throw error;

    return {
      success: true,
      data,
    };
  } catch (err) {
    console.error(
      "Question Service:",
      err
    );

    return {
      success: false,
      error: err.message,
    };
  }
};

/**
 * Get question by code
 * Example:
 * WT-0001
 */
export const getQuestionByCode =
  async (module, questionCode) => {
    try {
      const table = QUESTION_TABLES[module];

      const { data, error } =
        await supabase
          .from(table)
          .select("*")
          .eq(
            "question_code",
            questionCode
          )
          .single();

      if (error) throw error;

      return {
        success: true,
        data,
      };
    } catch (err) {
      console.error(err);

      return {
        success: false,
        error: err.message,
      };
    }
  };

/**
 * Random Question
 */
export const getRandomQuestion =
  async (
    module,
    filters = {}
  ) => {
    const result =
      await getQuestions(
        module,
        filters
      );

    if (!result.success) {
      return result;
    }

    const questions =
      result.data;

    if (!questions.length) {
      return {
        success: false,
        error:
          "No questions found.",
      };
    }

    const randomIndex =
      Math.floor(
        Math.random() *
          questions.length
      );

    return {
      success: true,
      data:
        questions[randomIndex],
    };
  };

/**
 * Convert Storage Path
 * into Public URL
 */
export const getQuestionImage =
  (imagePath) => {
    if (!imagePath) return null;

    const { data } =
      supabase.storage
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
  getQuestionByCode,
  getRandomQuestion,
  getQuestionImage,
};
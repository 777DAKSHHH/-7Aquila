import { supabase } from "../config/supabaseClient.js";

export const getQuestions = async (req, res) => {
  try {
    const { part } = req.query;

    let query = supabase
      .from("speaking_questions")
      .select("*")
      .eq("is_active", true);

    if (part) {
      query = query.eq("part", part);
    }

    const { data, error } = await query;

    if (error) {
      return res.status(400).json({
        success: false,
        message: error.message,
      });
    }

    return res.status(200).json({
      success: true,
      questions: data,
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: "Server error",
    });
  }
};

export const getQuestionSet = async (req, res) => {
  try {
    const { testSetId } = req.query;

    if (!testSetId) {
      return res.status(400).json({
        success: false,
        message: "testSetId is required"
      });
    }

    const { data, error } = await supabase
      .from("speaking_questions")
      .select(`
        id,
        part,
        question_text,
        difficulty,
        order_number
      `)
      .eq("test_set_id", testSetId)
      .eq("is_active", true)
      .order("part", { ascending: true })
      .order("order_number", { ascending: true });

    if (error) throw error;

    return res.status(200).json({
      success: true,
      questions: data
    });

  } catch (err) {
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
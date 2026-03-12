import { supabase } from "../config/supabaseClient.js";

export const getTestSets = async (req, res) => {
  try {
    const { categoryId, difficulty } = req.query;

    let query = supabase
      .from("test_sets")
      .select(`
        id,
        name,
        description,
        set_number,
        difficulty,
        category_id,
        categories (
          id,
          name
        )
      `)
      .eq("is_active", true)
      .order("set_number", { ascending: true });

    if (categoryId && categoryId !== "all") {
      query = query.eq("category_id", categoryId);
    }

    if (difficulty && difficulty !== "all") {
      query = query.eq("difficulty", difficulty);
    }

    const { data, error } = await query;

    if (error) throw error;

    return res.status(200).json({
      success: true,
      sets: data
    });

  } catch (err) {
    console.error("Get test sets error:", err);
    return res.status(500).json({
      success: false,
      message: err.message
    });
  }
};
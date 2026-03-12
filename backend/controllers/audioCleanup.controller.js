import { supabaseAdmin } from "../config/supabaseAdmin.js";

export const cleanupExpiredAudio = async (req, res) => {
  try {
    const now = new Date().toISOString();

    // 1️⃣ Find expired sessions
    const { data: sessions, error } = await supabaseAdmin
      .from("speaking_sessions")
      .select("id")
      .lt("audio_delete_after", now)
      .eq("audio_deleted", false);

    if (error) throw error;

    if (!sessions.length) {
      return res.json({
        success: true,
        message: "No expired audio to delete"
      });
    }

    // 2️⃣ Collect audio paths
    const sessionIds = sessions.map(s => s.id);

    const { data: responses, error: responseError } =
      await supabaseAdmin
        .from("speaking_responses")
        .select("audio_path")
        .in("session_id", sessionIds);

    if (responseError) throw responseError;

    const files = responses.map(r => r.audio_path);

    // 3️⃣ Delete from storage
    if (files.length) {
      const { error: storageError } =
        await supabaseAdmin.storage
          .from("speaking-audio")
          .remove(files);

      if (storageError) throw storageError;
    }

    // 4️⃣ Mark sessions as cleaned
    await supabaseAdmin
      .from("speaking_sessions")
      .update({ audio_deleted: true })
      .in("id", sessionIds);

    return res.json({
      success: true,
      deleted_files: files.length,
      sessions_cleaned: sessionIds.length
    });

  } catch (err) {
    console.error("Audio cleanup failed:", err);
    res.status(500).json({
      success: false,
      message: err.message
    });
  }
};

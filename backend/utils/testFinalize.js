import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function testFinalize() {
  const sessionId = "44959684-d833-46cf-b037-f8224f0675cf";
  console.log("Resetting status of session:", sessionId);

  const payload = {
    status: "in_progress",
    is_draft: true,
    completed_at: null,
    submitted_at: null
  };

  const { data, error } = await supabase
    .from("writing_sessions")
    .update(payload)
    .eq("id", sessionId)
    .select()
    .single();

  if (error) {
    console.error("Update failed:", error);
  } else {
    console.log("Update succeeded:", data);
  }
}

testFinalize();

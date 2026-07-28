import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";

const inspect = async () => {
  console.log("=== INSPECTING SPEAKING QUESTIONS SCHEMA ===");
  const { data, error } = await supabaseAdmin
    .from("speaking_questions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error fetching question:", error.message);
  } else {
    console.log("speaking_questions Columns:", data && data.length > 0 ? Object.keys(data[0]) : "No rows");
    console.log("Sample Row:", data && data.length > 0 ? data[0] : "None");
  }

  console.log("\n=== INSPECTING USER SETTINGS SCHEMA ===");
  const { data: settings, error: settingsError } = await supabaseAdmin
    .from("user_settings")
    .select("*")
    .limit(1);

  if (settingsError) {
    console.error("Error fetching settings:", settingsError.message);
  } else {
    console.log("user_settings Columns:", settings && settings.length > 0 ? Object.keys(settings[0]) : "No rows");
    console.log("Sample Row:", settings && settings.length > 0 ? settings[0] : "None");
  }
};

inspect();

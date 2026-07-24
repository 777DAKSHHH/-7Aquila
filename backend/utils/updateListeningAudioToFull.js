import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function updateAudio() {
  const testId = "9c5e6789-7cf4-458f-9fbd-b800a8f1c2c3";
  console.log("Updating listening sections for test:", testId);
  
  const { data, error } = await supabase
    .from("listening_sections")
    .update({ audio_url: "/uploads/audio/CB-20.1.mp3" })
    .eq("listening_test_id", testId)
    .select();
    
  if (error) {
    console.error("❌ Update failed:", error.message);
  } else {
    console.log("✅ Update succeeded! Updated sections:", data.map(s => s.section_number));
  }
}

updateAudio();

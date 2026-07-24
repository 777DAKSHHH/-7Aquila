import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function checkAudio() {
  const { data, error } = await supabase
    .from("listening_sections")
    .select("*")
    .limit(1);
    
  if (error) {
    console.error("Fetch failed:", error.message);
  } else {
    console.log("Listening Sections columns:", Object.keys(data[0] || {}));
    
    // Also select all audio_urls
    const { data: allData } = await supabase.from("listening_sections").select("id, audio_url");
    console.log("All audio URLs:", allData);
  }
}

checkAudio();

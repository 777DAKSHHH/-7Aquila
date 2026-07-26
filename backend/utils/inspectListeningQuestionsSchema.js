import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function inspectSchema() {
  console.log("Inspecting listening_questions columns...");
  const { data, error } = await supabase
    .from("listening_questions")
    .select("*")
    .limit(1);

  if (error) {
    console.error("Error:", error.message);
  } else {
    console.log("listening_questions Columns:", data && data.length > 0 ? Object.keys(data[0]) : "No rows");
  }
}

inspectSchema();

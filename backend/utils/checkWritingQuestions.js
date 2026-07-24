import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function selectAll() {
  const { data, error } = await supabase
    .from("writing_task2_questions")
    .select("*");
    
  if (error) {
    console.error("Select failed:", error.message);
  } else {
    console.log("Found", data.length, "questions in database:");
    console.log(data);
  }
}

selectAll();

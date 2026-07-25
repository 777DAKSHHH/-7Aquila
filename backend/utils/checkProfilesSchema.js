import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function checkSchema() {
  console.log("Checking profiles table schema...");
  
  const { data, error } = await supabase
    .from("profiles")
    .select("*")
    .limit(1);
    
  if (error) {
    console.error("❌ Error:", error.message);
  } else {
    const columns = data && data.length > 0 ? Object.keys(data[0]) : "No rows";
    console.log("Profiles Columns:", columns);
  }
}

checkSchema();

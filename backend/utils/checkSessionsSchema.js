import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function checkSchemas() {
  console.log("Checking session tables schema...");
  
  const tables = ["writing_sessions", "reading_sessions", "listening_sessions"];
  for (const table of tables) {
    const { data, error } = await supabase
      .from(table)
      .select("*")
      .limit(1);
      
    if (error) {
      console.error(`❌ Error on ${table}:`, error.message);
    } else {
      const columns = data && data.length > 0 ? Object.keys(data[0]) : "No rows (cannot inspect keys)";
      console.log(`\nTable: ${table}`);
      console.log("Columns:", columns);
    }
  }
}

checkSchemas();

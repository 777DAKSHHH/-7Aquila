import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function debugQueries() {
  console.log("Debugging Speaking Sessions Query...");
  const speak = await supabase
    .from("speaking_sessions")
    .select("id, completed_at, status, profiles(full_name)")
    .order("completed_at", { ascending: false })
    .limit(5);
  console.log("Speaking Error:", speak.error ? speak.error.message : "None");
  console.log("Speaking Count:", speak.data ? speak.data.length : 0);

  console.log("\nDebugging Writing Sessions Query...");
  const write = await supabase
    .from("writing_sessions")
    .select("id, completed_at, status, profiles(full_name)")
    .order("completed_at", { ascending: false })
    .limit(5);
  console.log("Writing Error:", write.error ? write.error.message : "None");
  console.log("Writing Count:", write.data ? write.data.length : 0);

  console.log("\nDebugging Reading Sessions Query...");
  const read = await supabase
    .from("reading_sessions")
    .select("id, completed_at, status, profiles(full_name)")
    .order("completed_at", { ascending: false })
    .limit(5);
  console.log("Reading Error:", read.error ? read.error.message : "None");
  console.log("Reading Count:", read.data ? read.data.length : 0);

  console.log("\nDebugging Listening Sessions Query...");
  const listen = await supabase
    .from("listening_sessions")
    .select("id, completed_at, status, profiles(full_name)")
    .order("completed_at", { ascending: false })
    .limit(5);
  console.log("Listening Error:", listen.error ? listen.error.message : "None");
  console.log("Listening Count:", listen.data ? listen.data.length : 0);
}

debugQueries();

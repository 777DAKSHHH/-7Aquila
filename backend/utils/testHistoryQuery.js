import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function testQuery() {
  const { data: readData } = await supabase.from('reading_sessions').select("*, reading_tests(*)").limit(1);
  console.log("Reading Session 1 fields:", readData ? Object.keys(readData[0] || {}) : "none");
  if (readData && readData[0]) {
    console.log("Reading session data:", readData[0]);
  }

  const { data: listenData } = await supabase.from('listening_sessions').select("*, listening_tests(*)").limit(1);
  console.log("Listening Session 1 fields:", listenData ? Object.keys(listenData[0] || {}) : "none");
  if (listenData && listenData[0]) {
    console.log("Listening session data:", listenData[0]);
  }
}

testQuery();

import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";

const studentIds = [
  "dabe7e95-7452-4619-a740-9b2e2bc3f80a",
  "3379f6ad-953e-4e00-8569-1de1b957acbf",
  "7bcbf7d3-f4c8-4d7e-a06a-881236a30ac4"
];

const findSessions = async () => {
  console.log("=== SEARCHING FOR STUDENT ATTEMPTS IN DB ===");

  for (const uid of studentIds) {
    console.log(`\n--------------------------------------------`);
    console.log(`Student ID: ${uid}`);

    // Check reading sessions
    const { data: readingSessions, error: rErr } = await supabaseAdmin
      .from("reading_sessions")
      .select("id, reading_test_id, raw_score, band_score, status, user_answers")
      .eq("student_id", uid);

    if (rErr) {
      console.error("Error reading sessions:", rErr.message);
    } else {
      console.log(`Reading Sessions (${readingSessions?.length || 0}):`);
      readingSessions?.forEach(s => {
        console.log(` - Session ID: ${s.id}, Test ID: ${s.reading_test_id}, Raw Score: ${s.raw_score}, Band: ${s.band_score}, Status: ${s.status}`);
      });
    }

    // Check listening sessions
    const { data: listeningSessions, error: lErr } = await supabaseAdmin
      .from("listening_sessions")
      .select("id, listening_test_id, raw_score, band_score, status, user_answers")
      .eq("student_id", uid);

    if (lErr) {
      console.error("Error listening sessions:", lErr.message);
    } else {
      console.log(`Listening Sessions (${listeningSessions?.length || 0}):`);
      listeningSessions?.forEach(s => {
        console.log(` - Session ID: ${s.id}, Test ID: ${s.listening_test_id}, Raw Score: ${s.raw_score}, Band: ${s.band_score}, Status: ${s.status}`);
      });
    }
  }
};

findSessions();

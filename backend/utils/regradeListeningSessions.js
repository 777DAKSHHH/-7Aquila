import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { scoreListeningSession } from "./listeningScoring.js";

async function regrade() {
  const sessionIds = [
    "9a1c8fb3-8c92-43a1-8bf0-5eefe51545f6",
    "c285a380-e7ec-421b-b1d0-20f06b68b092",
    "6935048a-ed4b-46d6-8a21-5fe09a12c6bc"
  ];

  for (const sid of sessionIds) {
    console.log(`\n------------------------------------------------------`);
    console.log(`Regrading session: ${sid}`);
    
    // 1. Fetch session
    const { data: session, error: sErr } = await supabaseAdmin
      .from("listening_sessions")
      .select("*")
      .eq("id", sid)
      .single();
      
    if (sErr) {
      console.error("Error fetching session:", sErr.message);
      continue;
    }

    console.log(`Original DB Score - Raw: ${session.raw_score}, Band: ${session.band_score}`);
    
    // 2. Fetch questions
    const { data: sections } = await supabaseAdmin
      .from("listening_sections")
      .select("id")
      .eq("listening_test_id", session.listening_test_id);
      
    const secIds = sections.map(s => s.id);
    const { data: questions } = await supabaseAdmin
      .from("listening_questions")
      .select("*")
      .in("section_id", secIds);

    // 3. Regrade using the updated engine
    const grading = scoreListeningSession(session.user_answers, questions);
    
    if (!grading.success) {
      console.error("Grading execution failed:", grading.error);
      continue;
    }

    console.log(`Regraded Score - Raw: ${grading.rawScore}, Band: ${grading.bandScore}`);

    // 4. Save updates to Supabase
    const { data: updatedSession, error: updateErr } = await supabaseAdmin
      .from("listening_sessions")
      .update({
        raw_score: grading.rawScore,
        band_score: grading.bandScore,
        status: "completed"
      })
      .eq("id", sid)
      .select();

    if (updateErr) {
      console.error("❌ Error updating database:", updateErr.message);
    } else {
      console.log(`✅ Session updated in database successfully! New Raw Score: ${updatedSession[0].raw_score}, New Band: ${updatedSession[0].band_score}`);
    }
  }
}

regrade();

import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { scoreReadingSession, calculateReadingBand } from "./readingScoring.js";

const regradeSessions = async () => {
  const sessionIds = [
    "94af6184-0fdb-466a-ab7b-e1f6f87e814c",
    "9c8a0f42-d808-40ee-b043-ed265a7f7517"
  ];

  console.log("=== REGRADING SPECIFIC SESSIONS ===");
  for (const id of sessionIds) {
    const { data: session, error } = await supabaseAdmin
      .from("reading_sessions")
      .select("*, reading_tests(*)")
      .eq("id", id)
      .maybeSingle();

    if (error || !session) {
      console.error(`Session ${id} not found or error:`, error?.message);
      continue;
    }

    // Get the questions and their correct answers
    const { data: passages, error: pError } = await supabaseAdmin
      .from("reading_passages")
      .select("id, passage_number, reading_questions(*)")
      .eq("reading_test_id", session.reading_test_id);

    if (pError || !passages) {
      console.error("Error fetching passages/questions:", pError?.message);
      continue;
    }

    const allQuestions = passages.flatMap(p => p.reading_questions || []);

    // Grade using updated grading engine
    const evaluation = scoreReadingSession(session.user_answers, allQuestions, session.reading_tests?.test_type);
    
    // Recalculate band score
    const calculatedBand = calculateReadingBand(evaluation.rawScore || 0, session.reading_tests?.test_type);

    console.log(`\nSession ${id}:`);
    console.log(`  Old Raw: ${session.raw_score} | Old Band: ${session.band_score}`);
    console.log(`  New Raw: ${evaluation.rawScore} | New Band: ${calculatedBand}`);

    // Update in database
    const { data: updatedSession, error: updateError } = await supabaseAdmin
      .from("reading_sessions")
      .update({
        raw_score: evaluation.rawScore,
        band_score: calculatedBand,
        updated_at: new Date().toISOString()
      })
      .eq("id", id)
      .select()
      .single();

    if (updateError) {
      console.error(`  Failed to update session ${id}:`, updateError.message);
    } else {
      console.log(`  Successfully updated to Database!`);
    }
  }
};

regradeSessions();

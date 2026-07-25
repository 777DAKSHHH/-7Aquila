import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function debugSessions() {
  const sessionIds = [
    "9a1c8fb3-8c92-43a1-8bf0-5eefe51545f6",
    "c285a380-e7ec-421b-b1d0-20f06b68b092",
    "6935048a-ed4b-46d6-8a21-5fe09a12c6bc"
  ];
  
  for (const sid of sessionIds) {
    console.log(`\n======================================================`);
    console.log(`SESSION: ${sid}`);
    console.log(`======================================================`);
    
    const { data: session, error: sErr } = await supabase
      .from("listening_sessions")
      .select("*")
      .eq("id", sid)
      .single();
      
    if (sErr) {
      console.error("Error fetching session:", sErr.message);
      continue;
    }
    
    console.log("Raw Score in DB:", session.raw_score);
    console.log("Band Score in DB:", session.band_score);
    console.log("User Answers:", JSON.stringify(session.user_answers, null, 2));
    
    // Fetch the correct answers
    const testId = session.listening_test_id;
    const { data: sections } = await supabase
      .from("listening_sections")
      .select("id")
      .eq("listening_test_id", testId);
    
    const secIds = sections.map(s => s.id);
    const { data: questions } = await supabase
      .from("listening_questions")
      .select("question_number, correct_answers")
      .in("section_id", secIds)
      .order("question_number", { ascending: true });
      
    console.log("\nComparison (User vs Correct):");
    questions.forEach(q => {
      const qNum = q.question_number;
      if (qNum >= 17 && qNum <= 30) {
        console.log(`Q${qNum} - User Answer: "${session.user_answers[String(qNum)]}" | Correct Key:`, q.correct_answers);
      }
    });
  }
}

debugSessions();

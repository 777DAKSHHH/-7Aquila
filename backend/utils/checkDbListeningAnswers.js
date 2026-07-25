import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function verifyAnswers() {
  console.log("Fetching seeded listening answers from DB...");
  
  // Fetch questions for the Cambridge 20 Test 1 sections
  const testId = "9c5e6789-7cf4-458f-9fbd-b800a8f1c2c3";
  
  const { data: sections, error: secErr } = await supabase
    .from("listening_sections")
    .select("id, section_number")
    .eq("listening_test_id", testId);
    
  if (secErr) {
    console.error("Error fetching sections:", secErr.message);
    return;
  }
  
  const sectionIds = sections.map(s => s.id);
  
  const { data: questions, error: qErr } = await supabase
    .from("listening_questions")
    .select("question_number, correct_answers")
    .in("section_id", sectionIds)
    .order("question_number", { ascending: true });
    
  if (qErr) {
    console.error("Error fetching questions:", qErr.message);
    return;
  }
  
  console.log(`Found ${questions.length} questions in DB.`);
  questions.forEach(q => {
    console.log(`Q${q.question_number}:`, q.correct_answers);
  });
}

verifyAnswers();

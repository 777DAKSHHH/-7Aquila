import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function getAnswers() {
  const rawId = "44c87878-f5cc-4621-bae6-701e1206ac81";
  console.log(`Searching for reading passage: "${rawId}"...`);

  // 1. Get reading passage info
  const { data: passage, error: pErr } = await supabase
    .from("reading_passages")
    .select("id, title")
    .eq("id", rawId)
    .maybeSingle();

  if (pErr) {
    console.error("Error fetching passage:", pErr.message);
    return;
  }

  if (!passage) {
    console.log("No passage found with exact ID. Checking tests...");
    // Let's print some passages to see
    const { data: list } = await supabase
      .from("reading_passages")
      .select("id, title")
      .limit(10);
    console.log("Existing passages list:", list);
    return;
  }

  console.log(`\nFound Passage: "${passage.title}" (ID: ${passage.id})`);

  // 2. Fetch all questions for this passage
  const { data: questions, error: qErr } = await supabase
    .from("reading_questions")
    .select("id, question_number, question_type, correct_answers, explanation")
    .eq("passage_id", passage.id)
    .order("question_number", { ascending: true });

  if (qErr) {
    console.error("Error fetching questions:", qErr.message);
    return;
  }

  console.log(`\nFound ${questions ? questions.length : 0} questions:`);
  if (questions) {
    questions.forEach(q => {
      console.log(`Q${q.question_number} [${q.question_type}]: Correct Answers: ${JSON.stringify(q.correct_answers)} | Explanation: ${q.explanation}`);
    });
  }
}

getAnswers();

import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { matchSingleAnswer } from "./readingScoring.js";

const inspectSessions = async () => {
  const sessionIds = [
    "94af6184-0fdb-466a-ab7b-e1f6f87e814c",
    "9c8a0f42-d808-40ee-b043-ed265a7f7517"
  ];

  console.log("=== INSPECTING SESSIONS ===");
  for (const id of sessionIds) {
    const { data: session, error } = await supabaseAdmin
      .from("reading_sessions")
      .select("*, reading_tests(*)")
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error(`Error fetching session ${id}:`, error.message);
      continue;
    }

    if (!session) {
      console.log(`Session ${id} not found.`);
      continue;
    }

    console.log(`\nSession ID: ${session.id}`);
    console.log(`Test Title: ${session.reading_tests?.title}`);
    console.log(`Status: ${session.status}`);
    console.log(`Raw Score in DB: ${session.raw_score}`);

    // Let's get the questions and their correct answers
    const { data: passages, error: pError } = await supabaseAdmin
      .from("reading_passages")
      .select("id, passage_number, reading_questions(*)")
      .eq("reading_test_id", session.reading_test_id)
      .order("passage_number");

    if (pError) {
      console.error("Error fetching passages/questions:", pError.message);
      continue;
    }

    let calculatedScore = 0;
    console.log("\n--- Comparison (User Answer vs Correct Answers) ---");
    passages.forEach(p => {
      console.log(`Passage ${p.passage_number}`);
      const questions = p.reading_questions || [];
      questions.sort((a,b) => a.question_number - b.question_number);
      questions.forEach(q => {
        const uAns = session.user_answers[String(q.question_number)];
        
        let isCorrect = false;
        if (q.correct_answers && q.correct_answers.length > 0) {
          const normalizedUserList = [];
          if (Array.isArray(uAns)) {
            uAns.forEach(val => {
              if (val) normalizedUserList.push(val);
            });
          } else if (uAns) {
            const parts = String(uAns).split(",");
            parts.forEach(part => {
              if (part) normalizedUserList.push(part);
            });
          }

          if (normalizedUserList.length > 0) {
            isCorrect = normalizedUserList.some(userVal => {
              return q.correct_answers.some(correctVal => matchSingleAnswer(userVal, correctVal, "", q.question_type));
            });
          }
        }

        if (isCorrect) {
          calculatedScore++;
        }

        console.log(`Q${q.question_number} [${q.question_type}]:`);
        console.log(`  User: ${JSON.stringify(uAns)}`);
        console.log(`  Correct: ${JSON.stringify(q.correct_answers)}`);
        console.log(`  IsMatched: ${isCorrect}`);
      });
    });
    console.log(`Calculated Score: ${calculatedScore}`);
  }
};

inspectSessions();

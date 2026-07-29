import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";
import { scoreListeningSession } from "./listeningScoring.js";

async function debugSessions() {
  console.log("Fetching Listening sessions for Test 4...");
  // Fetch test 4 id
  const { data: tests } = await supabase
    .from("listening_tests")
    .select("id, title")
    .ilike("title", "%Test 4%");
    
  if (!tests || tests.length === 0) {
    console.error("Test 4 not found.");
    return;
  }
  
  const testId = tests[0].id;
  console.log(`Found Test 4 ID: ${testId} ("${tests[0].title}")`);

  const { data: sessions, error } = await supabase
    .from("listening_sessions")
    .select("*")
    .eq("listening_test_id", testId)
    .order("completed_at", { ascending: false });
    
  if (error) {
    console.error("Error fetching sessions:", error.message);
    return;
  }
  
  console.log(`Found ${sessions.length} sessions for Test 4.`);
  
  // Fetch all questions for this test to score them
  const { data: sections } = await supabase
    .from("listening_sections")
    .select(`
      id,
      questions: listening_questions (
        id,
        section_id,
        question_number,
        question_type,
        correct_answers,
        explanation
      )
    `)
    .eq("listening_test_id", testId);
    
  const allQuestions = sections.flatMap(s => s.questions || []);

  for (const sess of sessions) {
    console.log(`\nSession ID: ${sess.id} | Completed: ${sess.completed_at}`);
    console.log(`Stored Raw Score: ${sess.raw_score} | Stored Band Score: ${sess.band_score}`);
    
    // Track groups
    const sortedQuestions = [...allQuestions].sort((a, b) => a.question_number - b.question_number);
    const groupedQuestionsMap = {};
    for (const q of sortedQuestions) {
      if (q.correct_answers && Array.isArray(q.correct_answers) && q.correct_answers.length > 1) {
        const sortedKeys = [...q.correct_answers].map(a => String(a).toLowerCase().trim()).sort();
        const groupKey = `${q.section_id}_${JSON.stringify(sortedKeys)}`;
        if (!groupedQuestionsMap[groupKey]) groupedQuestionsMap[groupKey] = [];
        groupedQuestionsMap[groupKey].push(q);
      }
    }

    console.log("Group keys found:");
    Object.keys(groupedQuestionsMap).forEach(key => {
      console.log(`- Key: ${key} | Questions: ${groupedQuestionsMap[key].map(q => q.question_number).join(", ")}`);
    });

    const grading = scoreListeningSession(sess.user_answers, allQuestions);
    console.log(`Re-graded Raw Score: ${grading.rawScore} | Re-graded Band Score: ${grading.bandScore}`);
    
    console.log("Detailed breakdown:");
    grading.results.forEach(r => {
      if (r.questionNumber >= 11 && r.questionNumber <= 24) {
        console.log(`Q${r.questionNumber} | User: "${r.userAnswer}" | Correct: ${JSON.stringify(r.correctAnswers)} | IsCorrect: ${r.isCorrect}`);
      }
    });
  }
}

debugSessions();

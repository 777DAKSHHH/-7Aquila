import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";
import { scoreListeningSession } from "./listeningScoring.js";
import { scoreReadingSession } from "./readingScoring.js";

async function fixListeningSessions() {
  console.log("=== FIXING LISTENING SESSIONS ===");
  
  // 1. Fetch all completed listening sessions
  const { data: sessions, error } = await supabase
    .from("listening_sessions")
    .select("*")
    .eq("status", "completed");

  if (error) {
    console.error("Error fetching listening sessions:", error.message);
    return;
  }

  console.log(`Found ${sessions.length} completed listening sessions.`);

  // 2. Fetch all listening questions grouped by test
  const { data: questions, error: qError } = await supabase
    .from("listening_questions")
    .select("id, section_id, question_number, question_type, correct_answers, explanation");

  if (qError) {
    console.error("Error fetching listening questions:", qError.message);
    return;
  }

  // Group questions by test (by querying sections to map section_id to test_id)
  const { data: sections, error: sError } = await supabase
    .from("listening_sections")
    .select("id, listening_test_id");

  if (sError) {
    console.error("Error fetching sections:", sError.message);
    return;
  }

  const sectionToTestMap = {};
  sections.forEach(s => {
    sectionToTestMap[s.id] = s.listening_test_id;
  });

  const testQuestionsMap = {};
  questions.forEach(q => {
    const testId = sectionToTestMap[q.section_id];
    if (testId) {
      if (!testQuestionsMap[testId]) testQuestionsMap[testId] = [];
      testQuestionsMap[testId].push(q);
    }
  });

  // 3. Score and update if mismatch
  let updatedCount = 0;
  for (const sess of sessions) {
    const testQs = testQuestionsMap[sess.listening_test_id] || [];
    if (testQs.length === 0) continue;

    const grading = scoreListeningSession(sess.user_answers || {}, testQs);
    if (!grading.success) continue;

    if (grading.rawScore !== sess.raw_score || grading.bandScore !== sess.band_score) {
      console.log(`Mismatch on Listening Session ${sess.id}: Stored: raw=${sess.raw_score}, band=${sess.band_score} | Correct: raw=${grading.rawScore}, band=${grading.bandScore}`);
      
      const { error: updateErr } = await supabase
        .from("listening_sessions")
        .update({
          raw_score: grading.rawScore,
          band_score: grading.bandScore,
          updated_at: new Date().toISOString()
        })
        .eq("id", sess.id);

      if (updateErr) {
        console.error(`Failed to update session ${sess.id}:`, updateErr.message);
      } else {
        console.log(`Successfully updated Listening Session ${sess.id}`);
        updatedCount++;
      }
    }
  }
  console.log(`Completed Listening updates: ${updatedCount} sessions fixed.`);
}

async function fixReadingSessions() {
  console.log("\n=== FIXING READING SESSIONS ===");

  // 1. Fetch all completed reading sessions
  const { data: sessions, error } = await supabase
    .from("reading_sessions")
    .select("*")
    .eq("status", "completed");

  if (error) {
    console.error("Error fetching reading sessions:", error.message);
    return;
  }

  console.log(`Found ${sessions.length} completed reading sessions.`);

  // 2. Fetch all reading questions grouped by test
  const { data: questions, error: qError } = await supabase
    .from("reading_questions")
    .select("id, passage_id, question_number, question_type, correct_answers, explanation");

  if (qError) {
    console.error("Error fetching reading questions:", qError.message);
    return;
  }

  // Group questions by test (by querying passages to map passage/section_id to test_id)
  const { data: passages, error: pError } = await supabase
    .from("reading_passages")
    .select("id, reading_test_id");

  if (pError) {
    console.error("Error fetching passages:", pError.message);
    return;
  }

  const passageToTestMap = {};
  passages.forEach(p => {
    passageToTestMap[p.id] = p.reading_test_id;
  });

  const testQuestionsMap = {};
  questions.forEach(q => {
    const testId = passageToTestMap[q.passage_id];
    if (testId) {
      if (!testQuestionsMap[testId]) testQuestionsMap[testId] = [];
      testQuestionsMap[testId].push(q);
    }
  });

  // Get reading test types to pass to scorer (Academic vs General Training)
  const { data: tests } = await supabase.from("reading_tests").select("id, type");
  const testTypeMap = {};
  tests?.forEach(t => {
    testTypeMap[t.id] = t.type || "academic";
  });

  // 3. Score and update if mismatch
  let updatedCount = 0;
  for (const sess of sessions) {
    const testQs = testQuestionsMap[sess.reading_test_id] || [];
    if (testQs.length === 0) continue;

    const testType = testTypeMap[sess.reading_test_id] || "academic";
    const grading = scoreReadingSession(sess.user_answers || {}, testQs, testType);
    if (!grading.success) continue;

    if (grading.rawScore !== sess.raw_score || grading.bandScore !== sess.band_score) {
      console.log(`Mismatch on Reading Session ${sess.id}: Stored: raw=${sess.raw_score}, band=${sess.band_score} | Correct: raw=${grading.rawScore}, band=${grading.bandScore}`);
      
      const { error: updateErr } = await supabase
        .from("reading_sessions")
        .update({
          raw_score: grading.rawScore,
          band_score: grading.bandScore,
          updated_at: new Date().toISOString()
        })
        .eq("id", sess.id);

      if (updateErr) {
        console.error(`Failed to update session ${sess.id}:`, updateErr.message);
      } else {
        console.log(`Successfully updated Reading Session ${sess.id}`);
        updatedCount++;
      }
    }
  }
  console.log(`Completed Reading updates: ${updatedCount} sessions fixed.`);
}

async function run() {
  await fixListeningSessions();
  await fixReadingSessions();
  console.log("\n=== DATABASE FIX COMPLETE ===");
}

run();

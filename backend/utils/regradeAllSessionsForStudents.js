import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";
import { scoreReadingSession } from "./readingScoring.js";
import { scoreListeningSession } from "./listeningScoring.js";

const studentIds = [
  "dabe7e95-7452-4619-a740-9b2e2bc3f80a",
  "3379f6ad-953e-4e00-8569-1de1b957acbf",
  "7bcbf7d3-f4c8-4d7e-a06a-881236a30ac4"
];

const regrade = async () => {
  console.log("=== STARTING STUDENT SESSIONS REGRADING ===");

  for (const studentId of studentIds) {
    console.log(`\n======================================================`);
    console.log(`PROCESSING STUDENT: ${studentId}`);

    // --- 1. READING SESSIONS ---
    const { data: readingSessions, error: rErr } = await supabaseAdmin
      .from("reading_sessions")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "completed");

    if (rErr) {
      console.error(`Error fetching reading sessions for ${studentId}:`, rErr.message);
    } else if (readingSessions && readingSessions.length > 0) {
      console.log(`Found ${readingSessions.length} completed reading sessions.`);
      for (const session of readingSessions) {
        console.log(`\nRegrading Reading Session: ${session.id} (Test ID: ${session.reading_test_id})`);
        
        // Fetch test info to get testType
        const { data: testInfo } = await supabaseAdmin
          .from("reading_tests")
          .select("test_type")
          .eq("id", session.reading_test_id)
          .single();

        const testType = testInfo?.test_type || "academic";

        // Fetch questions for this test
        const { data: passages } = await supabaseAdmin
          .from("reading_passages")
          .select("id")
          .eq("reading_test_id", session.reading_test_id);

        if (!passages || passages.length === 0) {
          console.error(`No passages found for test ${session.reading_test_id}`);
          continue;
        }

        const passageIds = passages.map(p => p.id);
        const { data: questions } = await supabaseAdmin
          .from("reading_questions")
          .select("*")
          .in("passage_id", passageIds);

        if (!questions || questions.length === 0) {
          console.error(`No questions found for passages: ${passageIds}`);
          continue;
        }

        // Grade
        const grading = scoreReadingSession(session.user_answers, questions, testType);
        if (!grading.success) {
          console.error(`Grading execution failed:`, grading.error);
          continue;
        }

        console.log(`Reading Score - Original Raw: ${session.raw_score}, Original Band: ${session.band_score}`);
        console.log(`Reading Score - Regraded Raw: ${grading.rawScore}, Regraded Band: ${grading.bandScore}`);

        // Update database
        const { error: updateErr } = await supabaseAdmin
          .from("reading_sessions")
          .update({
            raw_score: grading.rawScore,
            band_score: grading.bandScore
          })
          .eq("id", session.id);

        if (updateErr) {
          console.error(`❌ Failed to update reading session ${session.id}:`, updateErr.message);
        } else {
          console.log(`✅ Reading Session ${session.id} successfully updated!`);
        }
      }
    } else {
      console.log("No completed reading sessions found.");
    }

    // --- 2. LISTENING SESSIONS ---
    const { data: listeningSessions, error: lErr } = await supabaseAdmin
      .from("listening_sessions")
      .select("*")
      .eq("student_id", studentId)
      .eq("status", "completed");

    if (lErr) {
      console.error(`Error fetching listening sessions for ${studentId}:`, lErr.message);
    } else if (listeningSessions && listeningSessions.length > 0) {
      console.log(`Found ${listeningSessions.length} completed listening sessions.`);
      for (const session of listeningSessions) {
        console.log(`\nRegrading Listening Session: ${session.id} (Test ID: ${session.listening_test_id})`);

        // Fetch questions for this test
        const { data: sections } = await supabaseAdmin
          .from("listening_sections")
          .select("id")
          .eq("listening_test_id", session.listening_test_id);

        if (!sections || sections.length === 0) {
          console.error(`No sections found for listening test ${session.listening_test_id}`);
          continue;
        }

        const sectionIds = sections.map(s => s.id);
        const { data: questions } = await supabaseAdmin
          .from("listening_questions")
          .select("*")
          .in("section_id", sectionIds);

        if (!questions || questions.length === 0) {
          console.error(`No questions found for sections: ${sectionIds}`);
          continue;
        }

        // Grade
        const grading = scoreListeningSession(session.user_answers, questions);
        if (!grading.success) {
          console.error(`Grading execution failed:`, grading.error);
          continue;
        }

        console.log(`Listening Score - Original Raw: ${session.raw_score}, Original Band: ${session.band_score}`);
        console.log(`Listening Score - Regraded Raw: ${grading.rawScore}, Regraded Band: ${grading.bandScore}`);

        // Update database
        const { error: updateErr } = await supabaseAdmin
          .from("listening_sessions")
          .update({
            raw_score: grading.rawScore,
            band_score: grading.bandScore
          })
          .eq("id", session.id);

        if (updateErr) {
          console.error(`❌ Failed to update listening session ${session.id}:`, updateErr.message);
        } else {
          console.log(`✅ Listening Session ${session.id} successfully updated!`);
        }
      }
    } else {
      console.log("No completed listening sessions found.");
    }
  }

  console.log("\n=== REGRADING PROCESS COMPLETED ===");
};

regrade();

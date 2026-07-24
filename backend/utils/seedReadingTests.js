import { supabaseAdmin } from "../config/supabaseAdmin.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directories
const DATA_DIR = path.join(__dirname, "data");
const PRACTICE_DIR = path.join(DATA_DIR, "practice_passages");
const FULL_TESTS_DIR = path.join(DATA_DIR, "full_tests");

// Ensure data directories exist
if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
if (!fs.existsSync(PRACTICE_DIR)) fs.mkdirSync(PRACTICE_DIR, { recursive: true });
if (!fs.existsSync(FULL_TESTS_DIR)) fs.mkdirSync(FULL_TESTS_DIR, { recursive: true });

/**
 * Helper to seed a single test set with passages and questions
 */
const seedTestPayload = async (payload) => {
  try {
    console.log(`\nProcessing test: "${payload.title}"...`);

    // 1. Check if test already exists to keep it idempotent
    const { data: existingTest, error: checkError } = await supabaseAdmin
      .from("reading_tests")
      .select("id")
      .eq("title", payload.title)
      .maybeSingle();

    if (checkError) throw checkError;

    let testId;
    if (existingTest) {
      console.log(`Test "${payload.title}" already exists. Cleaning existing passages/questions...`);
      testId = existingTest.id;
      
      // Cascade delete existing passages to prevent duplicate constraint errors
      const { error: deleteError } = await supabaseAdmin
        .from("reading_passages")
        .delete()
        .eq("reading_test_id", testId);
      
      if (deleteError) throw deleteError;
    } else {
      // Insert new test metadata
      const { data: newTest, error: insertError } = await supabaseAdmin
        .from("reading_tests")
        .insert({
          title: payload.title,
          test_type: payload.test_type || "academic",
          difficulty: payload.difficulty || "intermediate",
          duration_minutes: payload.duration_minutes || 60,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      testId = newTest.id;
      console.log(`Created new test row. ID: ${testId}`);
    }

    // 2. Insert Passages and their corresponding Questions
    const passages = Array.isArray(payload.passages) ? payload.passages : [payload.passage];
    
    for (const psg of passages) {
      if (!psg) continue;
      
      console.log(`Inserting Passage ${psg.passage_number}: "${psg.title}"...`);
      const { data: newPassage, error: psgError } = await supabaseAdmin
        .from("reading_passages")
        .insert({
          reading_test_id: testId,
          passage_number: psg.passage_number,
          title: psg.title,
          sub_title: psg.sub_title || "",
          content_html: psg.content_html
        })
        .select()
        .single();

      if (psgError) throw psgError;
      const passageId = newPassage.id;

      // Filter questions matching this passage number or map if single practice passage
      const psgQuestions = payload.questions.filter(q => 
        // If it's a practice passage, all questions belong to this single passage
        passages.length === 1 ? true : q.passage_number === psg.passage_number
      );

      if (psgQuestions.length === 0) continue;

      console.log(`Inserting ${psgQuestions.length} questions for Passage ${psg.passage_number}...`);
      const questionRows = psgQuestions.map(q => ({
        passage_id: passageId,
        question_number: q.question_number,
        question_type: q.question_type,
        instruction_text: q.instruction_text,
        question_data: q.question_data,
        correct_answers: q.correct_answers,
        explanation: q.explanation || "",
        citation_excerpt: q.citation_excerpt || ""
      }));

      const { error: qError } = await supabaseAdmin
        .from("reading_questions")
        .insert(questionRows);

      if (qError) throw qError;
    }

    console.log(`Successfully completed seeding for "${payload.title}"!`);
  } catch (error) {
    console.error(`❌ Failed to seed test "${payload.title}":`, error.message || error);
  }
};

const runSeeder = async () => {
  console.log("=== STARTING READING DATABASE SEEDER ENGINE ===");

  // 1. Read and seed individual practice passages
  const practiceFiles = fs.readdirSync(PRACTICE_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${practiceFiles.length} practice passage JSON files.`);
  for (const file of practiceFiles) {
    const rawData = fs.readFileSync(path.join(PRACTICE_DIR, file), "utf-8");
    try {
      const payload = JSON.parse(rawData);
      await seedTestPayload(payload);
    } catch (err) {
      console.error(`Invalid JSON in file ${file}:`, err.message);
    }
  }

  // 2. Read and seed full 40-question tests
  const testFiles = fs.readdirSync(FULL_TESTS_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${testFiles.length} full test JSON files.`);
  for (const file of testFiles) {
    const rawData = fs.readFileSync(path.join(FULL_TESTS_DIR, file), "utf-8");
    try {
      const payload = JSON.parse(rawData);
      await seedTestPayload(payload);
    } catch (err) {
      console.error(`Invalid JSON in file ${file}:`, err.message);
    }
  }

  console.log("=== SEEDING COMPLETED ===");
};

runSeeder();

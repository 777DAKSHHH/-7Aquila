import { supabaseAdmin } from "../config/supabaseAdmin.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Data directories
const DATA_DIR = path.join(__dirname, "data");
const LISTENING_DIR = path.join(DATA_DIR, "listening_tests");

// Ensure directory exists
if (!fs.existsSync(LISTENING_DIR)) {
  fs.mkdirSync(LISTENING_DIR, { recursive: true });
}

/**
 * Helper to seed a single listening test with sections and questions
 */
const seedListeningTestPayload = async (payload) => {
  try {
    console.log(`\nProcessing listening test: "${payload.title}"...`);

    // 1. Check if test already exists (idempotency)
    const { data: existingTest, error: checkError } = await supabaseAdmin
      .from("listening_tests")
      .select("id")
      .eq("title", payload.title)
      .maybeSingle();

    if (checkError) throw checkError;

    let testId;
    if (existingTest) {
      console.log(`Test "${payload.title}" already exists. Cleaning existing sections/questions...`);
      testId = existingTest.id;
      
      // Cascade delete sections (will delete questions and sessions due to foreign keys)
      const { error: deleteError } = await supabaseAdmin
        .from("listening_sections")
        .delete()
        .eq("listening_test_id", testId);
      
      if (deleteError) throw deleteError;
    } else {
      // Insert new test metadata
      const { data: newTest, error: insertError } = await supabaseAdmin
        .from("listening_tests")
        .insert({
          title: payload.title,
          difficulty: payload.difficulty || "all",
          duration_minutes: payload.duration_minutes || 30,
          is_active: true
        })
        .select()
        .single();

      if (insertError) throw insertError;
      testId = newTest.id;
      console.log(`Created new listening test row. ID: ${testId}`);
    }

    // 2. Insert Sections and their corresponding Questions
    const sections = Array.isArray(payload.sections) ? payload.sections : [];
    
    for (const sec of sections) {
      console.log(`Inserting Section ${sec.section_number}: "${sec.title}"...`);
      const { data: newSection, error: secError } = await supabaseAdmin
        .from("listening_sections")
        .insert({
          listening_test_id: testId,
          section_number: sec.section_number,
          title: sec.title,
          instruction_text: sec.instruction_text || "",
          audio_url: sec.audio_url
        })
        .select()
        .single();

      if (secError) throw secError;
      const sectionId = newSection.id;

      // Filter questions matching this section number
      const secQuestions = payload.questions.filter(q => q.section_number === sec.section_number);

      if (secQuestions.length === 0) {
        console.log(`⚠️ No questions found for Section ${sec.section_number}`);
        continue;
      }

      console.log(`Inserting ${secQuestions.length} questions for Section ${sec.section_number}...`);
      const questionRows = secQuestions.map(q => ({
        section_id: sectionId,
        question_number: q.question_number,
        question_type: q.question_type,
        instruction_text: q.instruction_text,
        question_data: q.question_data,
        correct_answers: q.correct_answers,
        explanation: q.explanation || ""
      }));

      const { error: qError } = await supabaseAdmin
        .from("listening_questions")
        .insert(questionRows);

      if (qError) throw qError;
    }

    console.log(`Successfully completed seeding for "${payload.title}"!`);
  } catch (error) {
    console.error(`❌ Failed to seed test "${payload.title}":`, error.message || error);
  }
};

const runSeeder = async () => {
  console.log("=== STARTING LISTENING DATABASE SEEDER ===");

  if (!fs.existsSync(LISTENING_DIR)) {
    console.log("No listening tests directory found.");
    return;
  }

  const testFiles = fs.readdirSync(LISTENING_DIR).filter(f => f.endsWith(".json"));
  console.log(`Found ${testFiles.length} listening test JSON files.`);
  
  for (const file of testFiles) {
    const rawData = fs.readFileSync(path.join(LISTENING_DIR, file), "utf-8");
    try {
      const payload = JSON.parse(rawData);
      await seedListeningTestPayload(payload);
    } catch (err) {
      console.error(`Invalid JSON in file ${file}:`, err.message);
    }
  }

  console.log("=== SEEDING COMPLETED ===");
};

runSeeder();

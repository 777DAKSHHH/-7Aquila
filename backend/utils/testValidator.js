import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const LISTENING_DATA_DIR = path.join(__dirname, "data/listening_tests");
const READING_DATA_DIR = path.join(__dirname, "data/reading_tests");

function validateTestFile(filePath, type = "Listening") {
  console.log(`\nValidating ${type} Test File: "${path.basename(filePath)}"...`);
  
  if (!fs.existsSync(filePath)) {
    console.error(`❌ Error: File not found at "${filePath}"`);
    return false;
  }

  try {
    const rawData = fs.readFileSync(filePath, "utf-8");
    const testData = JSON.parse(rawData);

    // 1. Verify basic test structure
    if (!testData.title) {
      console.error("❌ Error: Missing test title");
      return false;
    }

    if (!Array.isArray(testData.sections) || testData.sections.length === 0) {
      console.error("❌ Error: Missing or empty 'sections' array");
      return false;
    }

    if (!Array.isArray(testData.questions) || testData.questions.length === 0) {
      console.error("❌ Error: Missing or empty 'questions' array");
      return false;
    }

    const questions = testData.questions;
    console.log(`Info: Found ${questions.length} questions.`);

    // 2. Verify exactly 40 questions
    if (questions.length !== 40) {
      console.error(`❌ Error: Expected exactly 40 questions, found ${questions.length}`);
      return false;
    }

    // 3. Verify sequential continuous numbering (1 to 40)
    const sortedQuestions = [...questions].sort((a, b) => a.question_number - b.question_number);
    let sequenceValid = true;
    for (let i = 0; i < 40; i++) {
      const expectedNum = i + 1;
      const q = sortedQuestions[i];
      if (!q || q.question_number !== expectedNum) {
        console.error(`❌ Error: Missing or duplicate question number. Expected question number ${expectedNum}, found: ${q ? q.question_number : "none"}`);
        sequenceValid = false;
      }
    }
    if (!sequenceValid) return false;

    // 4. Validate each question block details
    let questionsValid = true;
    questions.forEach((q) => {
      const qPrefix = `[Q${q.question_number}]`;

      // Check type
      if (!q.question_type) {
        console.error(`❌ Error: ${qPrefix} Missing question_type`);
        questionsValid = false;
      }

      // Check section number
      if (typeof q.section_number === "undefined") {
        console.error(`❌ Error: ${qPrefix} Missing section_number`);
        questionsValid = false;
      }

      // Check correct answers
      if (!Array.isArray(q.correct_answers) || q.correct_answers.length === 0) {
        console.error(`❌ Error: ${qPrefix} Missing or empty correct_answers array`);
        questionsValid = false;
      }

      // Check options for multiple-choice and matching types
      if (["mcq_single", "mcq_multiple", "matching", "matching_headings"].includes(q.question_type)) {
        const options = q.question_data?.options;
        if (!Array.isArray(options) || options.length === 0) {
          console.error(`❌ Error: ${qPrefix} Question type is "${q.question_type}" but options array is missing or empty`);
          questionsValid = false;
        } else {
          // Check for empty strings in options
          options.forEach((opt, idx) => {
            if (typeof opt !== "string" || opt.trim() === "") {
              console.error(`❌ Error: ${qPrefix} Option index ${idx} is empty or not a string`);
              questionsValid = false;
            }
          });
        }
      }

      // Check for sentence/table completion having standard question_data text
      if (["sentence_completion", "table_completion", "flow_chart", "summary_completion"].includes(q.question_type)) {
        const text = q.question_data?.text;
        if (typeof text !== "string" || text.trim() === "") {
          console.error(`❌ Error: ${qPrefix} Question type is "${q.question_type}" but question_data text is missing or empty`);
          questionsValid = false;
        }
      }
    });

    if (!questionsValid) {
      return false;
    }

    console.log("✅ Success: Test passed all validation checks!");
    return true;
  } catch (err) {
    console.error(`❌ Exception: Failed parsing JSON test file: ${err.message}`);
    return false;
  }
}

function runAllValidations() {
  console.log("=== STARTING CBT TESTS VALIDATION SYSTEM ===");
  let allPassed = true;

  // Validate Listening Tests
  if (fs.existsSync(LISTENING_DATA_DIR)) {
    const files = fs.readdirSync(LISTENING_DATA_DIR).filter(f => f.endsWith(".json"));
    files.forEach((file) => {
      const p = path.join(LISTENING_DATA_DIR, file);
      const ok = validateTestFile(p, "Listening");
      if (!ok) allPassed = false;
    });
  } else {
    console.warn("Warning: Listening tests directory not found.");
  }

  // Validate Reading Tests
  if (fs.existsSync(READING_DATA_DIR)) {
    const files = fs.readdirSync(READING_DATA_DIR).filter(f => f.endsWith(".json"));
    files.forEach((file) => {
      const p = path.join(READING_DATA_DIR, file);
      const ok = validateTestFile(p, "Reading");
      if (!ok) allPassed = false;
    });
  } else {
    console.warn("Warning: Reading tests directory not found.");
  }

  console.log("\n==========================================");
  if (allPassed) {
    console.log("🎉 ALL CBT TEST FILES ARE 100% VALID!");
    process.exit(0);
  } else {
    console.error("🚨 VALIDATION FAILED: Please fix the reported errors above.");
    process.exit(1);
  }
}

runAllValidations();

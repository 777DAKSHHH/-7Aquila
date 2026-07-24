import dotenv from "dotenv";
import path from "url";
import { fileURLToPath } from "url";
import pkg from "path";

const { join } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = pkg.dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

const sampleTask2Questions = [
  {
    question_code: "WT2-0001",
    title: "Technology and Social Isolation",
    question_text: "Some people believe that the increasing use of technology in daily life is making individuals more socially isolated. Others argue that technology helps connect people globally.\n\nDiscuss both views and give your opinion.",
    essay_type: "discussion",
    difficulty: "medium",
    recommended_time_minutes: 40,
    estimated_band: 7.0,
    is_active: true
  },
  {
    question_code: "WT2-0002",
    title: "University Education vs Vocational Training",
    question_text: "Many young people choose to go to university, but some believe that vocational training (e.g., learning a trade) is more useful for the economy and individuals.\n\nTo what extent do you agree or disagree with this statement?",
    essay_type: "opinion",
    difficulty: "easy",
    recommended_time_minutes: 40,
    estimated_band: 6.5,
    is_active: true
  },
  {
    question_code: "WT2-0003",
    title: "Tourism in Developing Nations",
    question_text: "Tourism is a growing industry in many developing countries. What are the advantages and disadvantages of this trend for local communities?",
    essay_type: "advantage_disadvantage",
    difficulty: "medium",
    recommended_time_minutes: 40,
    estimated_band: 7.5,
    is_active: true
  },
  {
    question_code: "WT2-0004",
    title: "Urbanization and Housing Shortages",
    question_text: "As major cities expand, housing shortages and overcrowding have become serious issues. What are the causes of these problems, and what measures can governments take to resolve them?",
    essay_type: "problem_solution",
    difficulty: "hard",
    recommended_time_minutes: 40,
    estimated_band: 8.0,
    is_active: true
  },
  {
    question_code: "WT2-0005",
    title: "Happiness and Economic Success",
    question_text: "Economic growth is often seen as the primary goal of any country. However, some argue that national happiness is a better indicator of success.\n\nWhat factors contribute to personal happiness? How can governments promote happiness in society?",
    essay_type: "double_question",
    difficulty: "hard",
    recommended_time_minutes: 40,
    estimated_band: 8.0,
    is_active: true
  }
];

async function seed() {
  console.log("Seeding Writing Task 2 questions...");

  // Delete existing seeded task 2 questions to prevent duplicates on reruns
  const { error: delErr } = await supabase
    .from("writing_task2_questions")
    .delete()
    .neq("id", "00000000-0000-0000-0000-000000000000"); // deletes all

  if (delErr) {
    console.error("Cleanup error (might be table columns mismatch):", delErr.message);
    console.log("Attempting to insert questions anyway...");
  }

  const { data, error } = await supabase
    .from("writing_task2_questions")
    .insert(sampleTask2Questions)
    .select();

  if (error) {
    console.error("❌ Seeding failed:", error.message);
    console.error("Details:", error.details);
  } else {
    console.log("✅ Seeding succeeded! Seeded", data.length, "questions.");
  }
}

seed();

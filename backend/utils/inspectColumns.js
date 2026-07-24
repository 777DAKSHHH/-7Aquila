import dotenv from "dotenv";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

const typesToTry = [
  "opinion_agree_disagree", "discuss_both_sides", "two_part_question", "direct_question", "causes_solutions",
  "Opinion / Agree-Disagree", "Discuss Both Sides", "Advantages/Disadvantages", "Problem/Solution", "Two-Part Question",
  "opinion_essay", "discussion_essay", "advantages_disadvantages_essay", "problem_solution_essay",
  "Opinion / Agree or Disagree", "Discuss both sides and give your opinion", "Advantages and Disadvantages",
  "agree-or-disagree", "discuss-both-sides", "advantages-and-disadvantages", "causes-and-solutions", "direct-questions",
  "agree_or_disagree", "discuss_both_sides_and_give_opinion", "advantages_and_disadvantages", "causes_and_solutions", "direct_questions"
];

async function testInsert() {
  for (const essayType of typesToTry) {
    console.log(`Trying essay_type: '${essayType}'...`);
    const { data, error } = await supabase
      .from("writing_task2_questions")
      .insert({
        question_text: "Some sample Task 2 essay prompt...",
        essay_type: essayType
      })
      .select();

    if (!error) {
      console.log(`✅ SUCCESS with essay_type: '${essayType}'!`);
      console.log("Row Columns:", Object.keys(data[0] || {}));
      console.log("Row Data:", data[0]);

      // Clean up
      await supabase
        .from("writing_task2_questions")
        .delete()
        .eq("id", data[0].id);
      return;
    } else {
      console.log(`❌ FAILED: ${error.message}`);
    }
  }
}

testInsert();

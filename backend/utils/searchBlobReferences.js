import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabase } from "../config/supabaseClient.js";

async function searchBlobs() {
  console.log("Searching reading_passages for blob references...");
  const { data: pList } = await supabase.from("reading_passages").select("id, title, text");
  let foundP = 0;
  pList?.forEach(p => {
    if (p.text && p.text.includes("-blob")) {
      console.log(`Found in reading passage: "${p.title}" (ID: ${p.id})`);
      const match = p.text.match(/src="([^"]+)"/g);
      console.log("Images referenced:", match);
      foundP++;
    }
  });
  if (foundP === 0) console.log("No blob references found in reading_passages.");

  console.log("\nSearching listening_questions for blob references...");
  const { data: qList } = await supabase.from("listening_questions").select("id, question_number, question_data");
  let foundQ = 0;
  qList?.forEach(q => {
    const qDataStr = JSON.stringify(q.question_data);
    if (qDataStr.includes("-blob")) {
      console.log(`Found in listening question Q${q.question_number} (ID: ${q.id})`);
      console.log("Data:", q.question_data);
      foundQ++;
    }
  });
  if (foundQ === 0) console.log("No blob references found in listening_questions.");
}

searchBlobs();

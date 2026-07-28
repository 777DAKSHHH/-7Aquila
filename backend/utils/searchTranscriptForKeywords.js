import fs from "fs";
import path from "path";

const TRANSCRIPT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/.system_generated/logs/transcript.jsonl";

function search() {
  if (!fs.existsSync(TRANSCRIPT_PATH)) {
    console.log("Transcript not found.");
    return;
  }

  const lines = fs.readFileSync(TRANSCRIPT_PATH, "utf-8").split("\n");
  console.log(`Searching transcript lines: ${lines.length}`);

  lines.forEach((line, index) => {
    if (!line) return;
    if (line.toLowerCase().includes("page 80")) {
      console.log(`Line ${index}: Matches 'page 80' | Length: ${line.length}`);
      // Print first 300 chars and match context
      const idx = line.toLowerCase().indexOf("page 80");
      console.log("Snippet:", line.substring(Math.max(0, idx - 100), Math.min(line.length, idx + 300)));
    }
  });
}

search();

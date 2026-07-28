import fs from "fs";
import path from "path";

const TRANSCRIPT_PATH = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/.system_generated/logs/transcript.jsonl";

function findMap() {
  if (!fs.existsSync(TRANSCRIPT_PATH)) {
    console.log("Transcript not found.");
    return;
  }

  const lines = fs.readFileSync(TRANSCRIPT_PATH, "utf-8").split("\n");
  console.log(`Searching transcript lines (${lines.length})...`);

  lines.forEach((line, index) => {
    if (!line) return;
    try {
      const obj = JSON.parse(line);
      const contentStr = JSON.stringify(obj);
      if (contentStr.includes("page 80") && index < 1000) {
        console.log(`Line ${index} matches page 80!`);
        console.log("Snippet:", contentStr.substring(0, 1000));
      }
    } catch (e) {
      // ignore parse errors
    }
  });
}

findMap();

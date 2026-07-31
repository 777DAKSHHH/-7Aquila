import fs from "fs";
import path from "path";

const ARTIFACT_DIR = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1";

function listAll() {
  if (!fs.existsSync(ARTIFACT_DIR)) {
    console.log("Artifact directory not found.");
    return;
  }

  const files = fs.readdirSync(ARTIFACT_DIR);
  console.log("All files in artifact directory:");
  files.forEach(f => {
    const p = path.join(ARTIFACT_DIR, f);
    const stat = fs.statSync(p);
    console.log(`File: "${f}" | Size: ${stat.size} bytes | Created/Modified: ${stat.mtime.toISOString()}`);
  });
}

listAll();

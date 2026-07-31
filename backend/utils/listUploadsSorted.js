import fs from "fs";
import path from "path";

const UPLOADS_DIR = "/Users/dakshparekh/Developer/Rocket/Rocket-Clean/backend/uploads";

function listUploads() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("Uploads directory not found.");
    return;
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  const fileStats = files.map(f => {
    const p = path.join(UPLOADS_DIR, f);
    return { name: f, stat: fs.statSync(p) };
  }).filter(item => !item.stat.isDirectory());

  fileStats.sort((a, b) => b.stat.mtimeMs - a.stat.mtimeMs);

  console.log("Recent files in backend/uploads:");
  fileStats.slice(0, 15).forEach(item => {
    console.log(`File: "${item.name}" | Size: ${item.stat.size} bytes | Modified: ${item.stat.mtime.toISOString()}`);
  });
}

listUploads();

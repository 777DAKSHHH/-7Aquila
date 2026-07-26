import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, "../uploads/audio");

function renameFiles() {
  const files = [
    { old: "CB 20.2.mp3", new: "CB-20.2.mp3" },
    { old: "CB 20.3.mp3", new: "CB-20.3.mp3" },
    { old: "CB 20.4.mp3", new: "CB-20.4.mp3" }
  ];

  files.forEach(f => {
    const oldPath = path.join(AUDIO_DIR, f.old);
    const newPath = path.join(AUDIO_DIR, f.new);

    if (fs.existsSync(oldPath)) {
      fs.renameSync(oldPath, newPath);
      console.log(`Renamed: "${f.old}" -> "${f.new}"`);
    } else {
      console.log(`File not found: "${f.old}" (may be already renamed)`);
    }
  });
}

renameFiles();

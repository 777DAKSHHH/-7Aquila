import fs from "fs";
import path from "path";

const SRC_FILE = "/Users/dakshparekh/.gemini/antigravity-ide/brain/fdb31453-5ce8-4a14-80c4-babdca48fde1/media__1785221775022.png";
const DEST_DIR = "/Users/dakshparekh/Developer/Rocket/Rocket-Clean/public/assets/images";
const DEST_FILE = path.join(DEST_DIR, "c20_t3_p2.png");

function copyMap() {
  if (!fs.existsSync(DEST_DIR)) {
    fs.mkdirSync(DEST_DIR, { recursive: true });
  }

  if (fs.existsSync(SRC_FILE)) {
    fs.copyFileSync(SRC_FILE, DEST_FILE);
    console.log(`Successfully copied map asset to: "${DEST_FILE}"`);
  } else {
    console.error(`Source file not found: "${SRC_FILE}"`);
  }
}

copyMap();

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const UPLOADS_DIR = path.join(__dirname, "../uploads");

function identifyFiles() {
  if (!fs.existsSync(UPLOADS_DIR)) {
    console.log("Uploads directory not found.");
    return;
  }

  const files = fs.readdirSync(UPLOADS_DIR);
  console.log(`Analyzing ${files.length} files in uploads...`);

  files.forEach(f => {
    const filePath = path.join(UPLOADS_DIR, f);
    if (fs.statSync(filePath).isDirectory()) return;

    try {
      const buffer = Buffer.alloc(8);
      const fd = fs.openSync(filePath, "r");
      fs.readSync(fd, buffer, 0, 8, 0);
      fs.closeSync(fd);

      const hex = buffer.toString("hex");
      const text = buffer.toString("utf-8");

      let type = "Unknown";
      if (text.startsWith("%PDF")) {
        type = "PDF Document";
      } else if (hex.startsWith("89504e47")) {
        type = "PNG Image";
      } else if (hex.startsWith("ffd8ff")) {
        type = "JPEG Image";
      } else if (hex.startsWith("47494638")) {
        type = "GIF Image";
      } else if (hex.startsWith("52494646") && hex.substring(16).startsWith("57454250")) {
        type = "WEBP Image";
      }

      console.log(`File: "${f}" | Size: ${fs.statSync(filePath).size} bytes | Type: ${type} | Hex: ${hex}`);
    } catch (err) {
      console.error(`Error reading ${f}:`, err.message);
    }
  });
}

identifyFiles();

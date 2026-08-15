import { supabase } from "../config/supabaseClient.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const AUDIO_DIR = path.join(__dirname, "../uploads/audio");
const LISTENING_DIR = path.join(__dirname, "data/listening_tests");

const runMigration = async () => {
  console.log("=== STARTING AUDIO MIGRATION TO SUPABASE STORAGE ===");

  try {
    // 1. Ensure 'audios' bucket exists and is public
    const { data: buckets, error: getBucketsErr } = await supabase.storage.listBuckets();
    if (getBucketsErr) throw getBucketsErr;

    const bucketExists = buckets.some(b => b.name === "audios");
    if (!bucketExists) {
      console.log("Bucket 'audios' not found. Creating it...");
      const { error: createErr } = await supabase.storage.createBucket("audios", {
        public: true
      });
      if (createErr) throw createErr;
      console.log("Bucket 'audios' created successfully.");
    } else {
      console.log("Bucket 'audios' already exists.");
    }

    // 2. Scan for MP3 files
    if (!fs.existsSync(AUDIO_DIR)) {
      console.error("Audio directory not found:", AUDIO_DIR);
      return;
    }

    const files = fs.readdirSync(AUDIO_DIR).filter(f => f.endsWith(".mp3"));
    console.log(`Found ${files.length} audio files locally.`);

    const urlMap = {};

    // 3. Upload files
    for (const file of files) {
      const filePath = path.join(AUDIO_DIR, file);
      const fileBuffer = fs.readFileSync(filePath);

      console.log(`Uploading ${file} (${(fileBuffer.length / (1024 * 1024)).toFixed(2)} MB)...`);

      const { data, error } = await supabase.storage
        .from("audios")
        .upload(file, fileBuffer, {
          contentType: "audio/mpeg",
          upsert: true
        });

      if (error) {
        console.error(`❌ Failed to upload ${file}:`, error.message);
        continue;
      }

      const { data: urlData } = supabase.storage.from("audios").getPublicUrl(file);
      urlMap[file] = urlData.publicUrl;
      console.log(`✅ Uploaded. Public URL: ${urlData.publicUrl}`);
    }

    // 4. Update JSON files to point to Supabase Storage public URLs
    console.log("\nUpdating listening test JSON files...");
    const jsonFiles = fs.readdirSync(LISTENING_DIR).filter(f => f.endsWith(".json"));

    for (const jsonFile of jsonFiles) {
      const jsonPath = path.join(LISTENING_DIR, jsonFile);
      let content = fs.readFileSync(jsonPath, "utf-8");
      let updated = false;

      // Scan and replace local paths with Supabase URLs
      for (const [filename, publicUrl] of Object.entries(urlMap)) {
        // Match both URL formats: `/uploads/audio/filename` and `uploads/audio/filename`
        const localPath1 = `/uploads/audio/${filename}`;
        const localPath2 = `uploads/audio/${filename}`;

        if (content.includes(localPath1)) {
          content = content.replaceAll(localPath1, publicUrl);
          updated = true;
        }
        if (content.includes(localPath2)) {
          content = content.replaceAll(localPath2, publicUrl);
          updated = true;
        }
      }

      if (updated) {
        fs.writeFileSync(jsonPath, content, "utf-8");
        console.log(`Updated URLs in: ${jsonFile}`);
      }
    }

    console.log("\n=== MIGRATION COMPLETED SUCCESSFULLY ===");
    console.log("Please re-run 'node utils/seedListeningTests.js' to update Supabase database rows.");

  } catch (err) {
    console.error("❌ Migration failed:", err.message || err);
  }
};

runMigration();

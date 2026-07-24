import { supabaseAdmin } from "../config/supabaseAdmin.js";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

// Resolving ES modules dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const BACKUP_DIR = path.join(__dirname, "..", "..", "student-audio-backups");

// Recursive crawler to list all files inside Supabase Storage bucket
const crawlBucket = async (currentPath = "") => {
  const bucketName = "speaking-audio";
  const { data, error } = await supabaseAdmin.storage
    .from(bucketName)
    .list(currentPath, { limit: 1000 });

  if (error) {
    throw new Error(`Failed to list files at path '${currentPath}': ${error.message}`);
  }

  let fileList = [];

  for (const item of data) {
    const itemPath = currentPath ? `${currentPath}/${item.name}` : item.name;
    
    // In Supabase, directory items return metadata without metadata.size or id === null
    if (!item.id && !item.metadata) {
      // It's a folder, crawl recursively
      const subFiles = await crawlBucket(itemPath);
      fileList = fileList.concat(subFiles);
    } else {
      // It's a file
      fileList.push({
        path: itemPath,
        size: item.metadata?.size || 0
      });
    }
  }

  return fileList;
};

const runBackup = async () => {
  console.log("=== STARTING SUPABASE AUDIO BACKUP TO MACBOOK (RESUME MODE) ===");
  try {
    const bucketName = "speaking-audio";

    // 1. Crawl bucket for all files
    console.log("Crawling storage bucket recursively...");
    const files = await crawlBucket("");
    console.log(`Found ${files.length} audio files in bucket.`);

    if (files.length === 0) {
      console.log("No files to backup.");
      return;
    }

    // 2. Ensure backup directory exists
    if (!fs.existsSync(BACKUP_DIR)) {
      fs.mkdirSync(BACKUP_DIR, { recursive: true });
    }
    console.log(`Saving backups to: ${BACKUP_DIR}`);

    // 3. Download each file
    let successCount = 0;
    let skippedCount = 0;
    let failCount = 0;

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      const percent = Math.round(((i + 1) / files.length) * 100);
      const localFilePath = path.join(BACKUP_DIR, file.path);

      // Check if file already exists locally
      if (fs.existsSync(localFilePath)) {
        const stats = fs.statSync(localFilePath);
        // If file exists and size matches or is close, skip download
        if (stats.size > 0) {
          skippedCount++;
          continue;
        }
      }

      console.log(`[${percent}%] Downloading (${i + 1}/${files.length}): ${file.path} (${(file.size / 1024).toFixed(1)} KB)...`);

      try {
        const { data, error } = await supabaseAdmin.storage
          .from(bucketName)
          .download(file.path);

        if (error) throw error;

        // Create nested directories locally if needed
        const fileDir = path.dirname(localFilePath);
        if (!fs.existsSync(fileDir)) {
          fs.mkdirSync(fileDir, { recursive: true });
        }

        // Convert Blob response to Node Buffer and save to disk
        const arrayBuffer = await data.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);
        fs.writeFileSync(localFilePath, buffer);
        successCount++;
      } catch (err) {
        console.error(`❌ Failed to download ${file.path}:`, err.message || err);
        failCount++;
      }
    }

    console.log("\n=== BACKUP SUMMARY ===");
    console.log(`Successfully Downloaded: ${successCount} files`);
    console.log(`Skipped (Already Exists): ${skippedCount} files`);
    console.log(`Failed: ${failCount} files`);
    console.log(`Backup Folder: ${BACKUP_DIR}`);
    console.log("======================");
  } catch (error) {
    console.error("Critical error during backup:", error.message || error);
  }
};

runBackup();

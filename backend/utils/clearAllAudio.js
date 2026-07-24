import { supabaseAdmin } from "../config/supabaseAdmin.js";

/**
 * Script to clean up the Supabase storage bucket 'speaking-audio' 
 * after the user successfully backed up all files locally.
 * This frees up the Supabase free-plan storage quota.
 */
const clearAllAudio = async () => {
  try {
    console.log("=== STARTING SUPABASE AUDIO CLEANUP ===");
    console.log("Retrieving files from 'speaking-audio' bucket...");

    // 1. List all files in the bucket
    const { data: files, error: listError } = await supabaseAdmin.storage
      .from("speaking-audio")
      .list("", { limit: 5000 });

    if (listError) throw listError;

    if (!files || files.length === 0) {
      console.log("The bucket is already empty! No files to delete.");
      return;
    }

    console.log(`Found ${files.length} files in the bucket. Preparing deletion...`);

    // Extract paths to delete
    const filePaths = files.map(f => f.name);

    // 2. Remove files in chunks of 100 to avoid API request limits
    const CHUNK_SIZE = 100;
    for (let i = 0; i < filePaths.length; i += CHUNK_SIZE) {
      const chunk = filePaths.slice(i, i + CHUNK_SIZE);
      console.log(`Deleting chunk ${i / CHUNK_SIZE + 1} (${chunk.length} files)...`);
      
      const { error: deleteError } = await supabaseAdmin.storage
        .from("speaking-audio")
        .remove(chunk);

      if (deleteError) {
        console.error(`Failed to delete chunk starting at index ${i}:`, deleteError.message);
      }
    }

    console.log("=== CLEANUP SUCCESSFUL: SUPABASE QUOTA RESTORED ===");
  } catch (error) {
    console.error("❌ Cleanup failed:", error.message || error);
  }
};

clearAllAudio();

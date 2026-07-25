import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";

async function configureBucket() {
  console.log("Checking storage buckets...");
  
  try {
    const { data: buckets, error: getError } = await supabaseAdmin.storage.listBuckets();
    if (getError) throw getError;
    
    const avatarBucket = buckets.find(b => b.id === "avatars");
    if (avatarBucket) {
      console.log("✅ 'avatars' bucket already exists. Public:", avatarBucket.public);
      if (!avatarBucket.public) {
        console.log("Updating 'avatars' bucket to be PUBLIC...");
        const { error: updateError } = await supabaseAdmin.storage.updateBucket("avatars", {
          public: true
        });
        if (updateError) throw updateError;
        console.log("✅ 'avatars' bucket updated to PUBLIC successfully.");
      }
    } else {
      console.log("Creating 'avatars' bucket as PUBLIC...");
      const { error: createError } = await supabaseAdmin.storage.createBucket("avatars", {
        public: true,
        fileSizeLimit: 5242880, // 5MB
        allowedMimeTypes: ["image/jpeg", "image/png", "image/gif", "image/webp"]
      });
      if (createError) throw createError;
      console.log("✅ 'avatars' bucket created as PUBLIC successfully.");
    }
  } catch (err) {
    console.error("❌ Storage bucket configuration failed:", err.message);
  }
}

configureBucket();

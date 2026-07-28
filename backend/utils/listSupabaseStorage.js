import dotenv from "dotenv";
import pkg from "path";
import { fileURLToPath } from "url";

const { join, dirname } = pkg;
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
dotenv.config({ path: join(__dirname, "../.env") });

import { supabaseAdmin } from "../config/supabaseAdmin.js";

async function listBuckets() {
  console.log("Listing Supabase Storage Buckets...");
  const { data: buckets, error: bErr } = await supabaseAdmin.storage.listBuckets();
  
  if (bErr) {
    console.error("Error listing buckets:", bErr.message);
    return;
  }
  
  console.log("Found buckets:", buckets);
  
  for (const b of buckets) {
    console.log(`\nListing files in bucket "${b.name}"...`);
    const { data: files, error: fErr } = await supabaseAdmin.storage.from(b.name).list("", { limit: 100 });
    if (fErr) {
      console.error(`Error listing bucket "${b.name}":`, fErr.message);
    } else {
      console.log(`Files in "${b.name}":`, files.map(f => f.name));
    }
  }
}

listBuckets();

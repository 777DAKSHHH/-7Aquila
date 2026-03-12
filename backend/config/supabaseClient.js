import dotenv from "dotenv";
dotenv.config(); // ✅ must be first

import { createClient } from "@supabase/supabase-js";

const supabaseUrl = process.env.SUPABASE_URL;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!supabaseUrl || !serviceRoleKey) {
  console.error("SUPABASE_URL =", supabaseUrl);
  console.error(
    "SUPABASE_SERVICE_ROLE_KEY exists =",
    !!serviceRoleKey
  );
  throw new Error("❌ Supabase service role env variables missing");
}

export const supabase = createClient(
  supabaseUrl,
  serviceRoleKey,
  {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  }
);

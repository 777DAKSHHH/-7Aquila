import { supabaseAdmin } from "../config/supabaseAdmin.js";

async function check() {
  console.log("Checking Supabase tables...");
  
  const { data: testSets, error: errSets } = await supabaseAdmin.from("test_sets").select("id, name");
  console.log("test_sets count:", testSets ? testSets.length : 0, errSets || "");
  
  const { data: readingTests, error: errRead } = await supabaseAdmin.from("reading_tests").select("id, title");
  console.log("reading_tests count:", readingTests ? readingTests.length : 0, errRead || "");
  
  const { data: listeningTests, error: errListen } = await supabaseAdmin.from("listening_tests").select("id, title");
  console.log("listening_tests count:", listeningTests ? listeningTests.length : 0, errListen || "");
}

check();

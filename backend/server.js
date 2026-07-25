import dotenv from "dotenv";
dotenv.config();

import express from "express";
import cors from "cors";
import path from "path";
import { fileURLToPath } from "url";
import speakingRoutes from "./routes/speaking.routes.js";
import questionsRoutes from "./routes/questions.routes.js";
import testSetsRoutes from "./routes/testSets.routes.js";
import authRoutes from "./routes/auth.routes.js";
import readingRoutes from "./routes/reading.routes.js";
import listeningRoutes from "./routes/listening.routes.js";
import settingsRoutes from "./routes/settings.routes.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const corsOptions = {
  origin: [
    "https://sevenbandaquila.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: [
    "GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"
  ],
  credentials: true
};

app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(express.json());

// Serve static files from the 'uploads' directory
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

app.use("/api/speaking", speakingRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/test-sets", testSetsRoutes);
app.use("/api/reading", readingRoutes);
app.use("/api/listening", listeningRoutes);
app.use("/api/settings", settingsRoutes);
app.use("/api", authRoutes);

import { supabase } from "./config/supabaseClient.js";

app.get("/api/db-debug", async (req, res) => {
  try {
    const { data: testSets, error: errSets } = await supabase.from("test_sets").select("id");
    const { data: readingTests, error: errRead } = await supabase.from("reading_tests").select("id");
    const { data: listeningTests, error: errListen } = await supabase.from("listening_tests").select("id");
    
    res.json({
      success: true,
      supabaseUrl: process.env.SUPABASE_URL,
      testSetsCount: testSets ? testSets.length : 0,
      testSetsError: errSets ? errSets.message : null,
      readingTestsCount: readingTests ? readingTests.length : 0,
      readingTestsError: errRead ? errRead.message : null,
      listeningTestsCount: listeningTests ? listeningTests.length : 0,
      listeningTestsError: errListen ? errListen.message : null
    });
  } catch (err) {
    res.json({
      success: false,
      error: err.message
    });
  }
});

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "IELTS Backend Running"
  });
});

const PORT = process.env.PORT || 5000;
app.listen(PORT, () => {
  console.log(`✅ Backend running on http://localhost:${PORT}`);
});

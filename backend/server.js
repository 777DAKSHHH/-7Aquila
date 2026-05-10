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

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

app.use(cors({
  origin: [
    "https://sevenbandaquila.onrender.com",
    "http://localhost:5173",
    "http://localhost:3000"
  ],
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  credentials: true
}));
app.options('*', cors());
app.use(express.json());

app.use("/api/speaking", speakingRoutes);
app.use("/api/questions", questionsRoutes);
app.use("/api/test-sets", testSetsRoutes);
app.use("/api", authRoutes);

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

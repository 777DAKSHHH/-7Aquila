import express from "express";
import {
  startSpeakingSession,
  uploadSpeakingResponse,
  completeSpeakingSession,
  testSupabaseConnection,
  getSpeakingSessionSummary,
  evaluateAISession,
  teacherReviewSession
} from "../controllers/speaking.controller.js";

import upload from "../middleware/upload.middleware.js";

import { cleanupExpiredAudio } from "../controllers/audioCleanup.controller.js";

const router = express.Router();

router.get("/session/:sessionId/summary", getSpeakingSessionSummary);

/**
 * Test Supabase DB connection
 */
router.get("/test-db", testSupabaseConnection);

/**
 * Start a new speaking session
 */
router.post("/session/start", startSpeakingSession);

/**
 * Upload answer audio for a question
 */
router.post(
  "/session/:sessionId/response",
  upload.single("audio_file"),
  uploadSpeakingResponse
);

/**
 * Complete speaking session
 */
router.post("/session/:sessionId/complete", completeSpeakingSession);

router.post(
  "/session/:sessionId/evaluate-ai",
  evaluateAISession
);

router.patch(
  "/session/:sessionId/teacher-review",
  teacherReviewSession
);

router.post("/cleanup/audio", cleanupExpiredAudio);

export default router;

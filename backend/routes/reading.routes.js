import express from "express";
import {
  getReadingTests,
  getReadingTestDetails,
  createReadingSession,
  saveReadingDraft,
  submitReadingSession
} from "../controllers/reading.controller.js";

const router = express.Router();

// Fetch active reading tests
router.get("/tests", getReadingTests);

// Fetch details for a reading test (passages & questions)
router.get("/tests/:testId", getReadingTestDetails);

// Initialize a session
router.post("/sessions", createReadingSession);

// Save progress draft
router.put("/sessions/:sessionId/draft", saveReadingDraft);

// Submit and grade a session
postSubmitSession();

function postSubmitSession() {
  router.post("/sessions/:sessionId/submit", submitReadingSession);
}

export default router;

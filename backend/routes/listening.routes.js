import express from "express";
import {
  getListeningTests,
  getListeningTestDetails,
  createListeningSession,
  saveListeningDraft,
  submitListeningSession
} from "../controllers/listening.controller.js";

const router = express.Router();

// Fetch active listening tests
router.get("/tests", getListeningTests);

// Fetch details for a listening test (sections & questions)
router.get("/tests/:testId", getListeningTestDetails);

// Initialize a session
router.post("/sessions", createListeningSession);

// Save progress draft
router.put("/sessions/:sessionId/draft", saveListeningDraft);

// Submit and grade a session
router.post("/sessions/:sessionId/submit", submitListeningSession);

export default router;

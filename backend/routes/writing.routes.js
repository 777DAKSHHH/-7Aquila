import express from "express";
import { evaluateWritingProxy } from "../controllers/writing.controller.js";

const router = express.Router();

/**
 * Route: POST /api/writing/evaluate-proxy
 * Securely proxies evaluation completion requests to OpenAI using server-side keys
 */
router.post("/evaluate-proxy", evaluateWritingProxy);

export default router;

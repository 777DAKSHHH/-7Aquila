import express from "express";
import { getQuestions, getQuestionSet } from "../controllers/questions.controller.js";

const router = express.Router();

router.get("/", getQuestions);
router.get("/set", getQuestionSet);

export default router;
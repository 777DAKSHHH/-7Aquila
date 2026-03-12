import express from "express";
import { getTestSets } from "../controllers/testSets.controller.js";

const router = express.Router();

router.get("/", getTestSets);

export default router;
import express from "express";
import { uploadAvatar } from "../controllers/settings.controller.js";

const router = express.Router();

router.post("/avatar", uploadAvatar);

export default router;

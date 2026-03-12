import express from "express"
import { getUserEmail } from "../controllers/auth.controller.js"

const router = express.Router()

router.post("/get-email", getUserEmail)

export default router
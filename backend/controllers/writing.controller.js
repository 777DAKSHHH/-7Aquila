import { supabase } from "../config/supabaseClient.js";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

/**
 * Secure Backend Proxy Controller for Writing AI Evaluation (Sprint 4 Secure Migration)
 *
 * Verifies Supabase authentication token and executes secure chat completions with OpenAI
 * without exposing the private OpenAI API key to the client browser.
 */
export const evaluateWritingProxy = async (req, res) => {
  try {
    const authHeader = req.headers.authorization;

    // 1. Verify Authorization Header
    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Missing Authorization header.",
      });
    }

    const token = authHeader.replace("Bearer ", "").trim();

    const { data: { user }, error: authError } = await supabase.auth.getUser(token);

    if (authError || !user) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized access. Invalid or expired token.",
      });
    }

    const { systemPrompt, userPrompt, model = "gpt-4o", configuration = {} } = req.body;

    if (!systemPrompt || !userPrompt) {
      return res.status(400).json({
        success: false,
        message: "Missing systemPrompt or userPrompt for AI completion.",
      });
    }

    const temperature = configuration.temperature ?? 0.2;
    const maxTokens = configuration.maxTokens ?? 2500;

    // 2. Call OpenAI Chat Completions endpoint securely
    const response = await openai.chat.completions.create({
      model,
      temperature,
      max_tokens: maxTokens,
      response_format: { type: "json_object" },
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
    });

    // 3. Return completion payload matching standard OpenAI completions format
    return res.json({
      success: true,
      data: response,
    });
  } catch (err) {
    console.error("[Rocket Backend Writing Proxy Error]", err);
    return res.status(500).json({
      success: false,
      message: err.message || "An unexpected error occurred during secure writing evaluation.",
    });
  }
};

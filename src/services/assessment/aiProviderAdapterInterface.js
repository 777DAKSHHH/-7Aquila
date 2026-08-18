/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * AI PROVIDER ADAPTER INTERFACE & ADAPTERS (Sprint 4 - Phase 3)
 *
 * Pluggable provider adapters implementing a common execution contract.
 * Supported Adapters: OpenAI (with Gemini/Claude stubs).
 * Does NOT parse JSON or calculate band scores. Returns raw provider response.
 * ==========================================================
 */

import { supabase } from "../../supabaseClient";
import { API_BASE_URL } from "../../config/apiConfig";

/**
 * OpenAI Provider Adapter Implementation
 */
export const OpenAIProviderAdapter = {
  name: "openai",

  /**
   * Execute raw request to OpenAI API
   *
   * @param {Object} params
   * @param {Object} params.evaluationPackage - Standardized Evaluation Package from Phase 2
   * @param {string} params.apiKey - OpenAI API Key
   * @param {string} params.model - Target model (default 'gpt-4o')
   * @param {number} params.timeoutMs - Timeout in milliseconds
   * @param {AbortSignal} params.signal - AbortController signal for cancellation
   * @returns {Promise<Object>} Raw provider response object
   */
  async sendEvaluationRequest({
    evaluationPackage,
    apiKey,
    model = "gpt-4o",
    timeoutMs = 30000,
    signal,
  }) {
    const startTime = Date.now();
    const systemPrompt = evaluationPackage?.systemPrompt || "";
    const userPrompt = evaluationPackage?.userPrompt || "";

    // Get user's active session token
    let token = "";
    try {
      const { data } = await supabase.auth.getSession();
      token = data?.session?.access_token || "";
    } catch (e) {
      console.warn("[Rocket OpenAI Adapter] Failed to resolve auth session:", e);
    }

    // Dev Fallback / Mock Response when API Key or Auth Token is missing in local environment
    if ((!apiKey || apiKey === "your-openai-api-key-here") && !token) {
      console.warn("[Rocket OpenAI Adapter] No active API key or user session found. Executing environment fallback mode.");
      await new Promise((resolve) => setTimeout(resolve, 1200));
 
       const mockRawContent = JSON.stringify({
         overall_band: 6.5,
         criterion_scores: {
           task_achievement: 6.5,
           coherence_and_cohesion: 6.5,
           lexical_resource: 6.0,
           grammatical_range_and_accuracy: 7.0,
         },
         strengths: [
           "Presents a clear overview of the main features in the data.",
           "Good variety of sentence structures with complex comparisons.",
         ],
         weaknesses: [
           "Minor lexical inaccuracies in describing percentage trends.",
           "Paragraphing could be slightly more distinct in section transitions.",
         ],
         task_achievement_feedback: "The report fulfills the task requirements effectively with accurate data points.",
         coherence_feedback: "Logical organization with effective use of linking words throughout.",
         vocabulary_feedback: "Good range of Academic Task 1 vocabulary, though a few collocations could be improved.",
         grammar_feedback: "High proportion of error-free sentences with strong grammatical control.",
         improvement_plan: [
           "Practice precise trend vocabulary for bar chart comparisons.",
           "Use more varied transitional phrases between paragraphs.",
         ],
         summary: "Solid Task 1 report response demonstrating strong competence across criteria.",
       });
 
       return {
         provider: "openai",
         model: `${model}-dev-fallback`,
         requestId: `req_mock_${Date.now()}`,
         usage: {
           promptTokens: 450,
           completionTokens: 380,
           totalTokens: 830,
         },
         finishReason: "stop",
         latencyMs: Date.now() - startTime,
         rawContent: mockRawContent,
         rawResponse: {
           id: `chatcmpl-mock-${Date.now()}`,
           object: "chat.completion",
           created: Math.floor(Date.now() / 1000),
         },
       };
     }
 
     // Secure Live Backend Proxy API Call (OpenAI key is hidden on the server)
     const controller = new AbortController();
     const timeoutId = setTimeout(() => controller.abort(), timeoutMs);
 
     const onExternalAbort = () => controller.abort();
     if (signal) {
       signal.addEventListener("abort", onExternalAbort);
     }
 
     try {
       const response = await fetch(`${API_BASE_URL}/api/writing/evaluate-proxy`, {
         method: "POST",
         headers: {
           "Content-Type": "application/json",
           Authorization: `Bearer ${token}`,
         },
         signal: controller.signal,
         body: JSON.stringify({
           model,
           systemPrompt,
           userPrompt,
           configuration: {
             temperature: evaluationPackage.configuration?.temperature ?? 0.2,
             maxTokens: evaluationPackage.configuration?.maxTokens ?? 2500,
           },
         }),
       });
 
       clearTimeout(timeoutId);
       if (signal) signal.removeEventListener("abort", onExternalAbort);
 
       if (!response.ok) {
         const errorJson = await response.json().catch(() => ({}));
         const err = new Error(
           errorJson?.message ||
             `Backend Proxy returned HTTP ${response.status}: ${response.statusText}`
         );
         err.status = response.status;
         err.headers = response.headers;
         throw err;
       }
 
       const resJson = await response.json();
       if (!resJson || !resJson.success || !resJson.data) {
         throw new Error(resJson?.message || "Secure backend proxy returned invalid response structure.");
       }
       
       const resData = resJson.data;
       const rawContent = resData?.choices?.[0]?.message?.content || "";

      return {
        provider: "openai",
        model: resData.model || model,
        requestId: response.headers.get("x-request-id") || resData.id || "",
        usage: {
          promptTokens: resData?.usage?.prompt_tokens || 0,
          completionTokens: resData?.usage?.completion_tokens || 0,
          totalTokens: resData?.usage?.total_tokens || 0,
        },
        finishReason: resData?.choices?.[0]?.finish_reason || "stop",
        latencyMs: Date.now() - startTime,
        rawContent,
        rawResponse: resData,
      };
    } catch (err) {
      clearTimeout(timeoutId);
      if (signal) signal.removeEventListener("abort", onExternalAbort);
      throw err;
    }
  },
};

/**
 * Gemini Provider Adapter Stub (Pluggable Future Provider)
 */
export const GeminiProviderAdapter = {
  name: "gemini",
  async sendEvaluationRequest() {
    throw new Error("Gemini Provider Adapter is not configured in this environment.");
  },
};

/**
 * Claude Provider Adapter Stub (Pluggable Future Provider)
 */
export const ClaudeProviderAdapter = {
  name: "claude",
  async sendEvaluationRequest() {
    throw new Error("Claude Provider Adapter is not configured in this environment.");
  },
};

/**
 * Registered Adapters Map
 */
export const ADAPTERS_MAP = {
  openai: OpenAIProviderAdapter,
  gemini: GeminiProviderAdapter,
  claude: ClaudeProviderAdapter,
};

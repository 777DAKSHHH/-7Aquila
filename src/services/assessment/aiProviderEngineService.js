import { ADAPTERS_MAP } from "./aiProviderAdapterInterface";

/**
 * ==========================================================
 * ROCKET ASSESSMENT ENGINE
 *
 * AI PROVIDER ENGINE SERVICE (Sprint 4 - Phase 3)
 *
 * Centralized gateway for executing requests against AI providers.
 * Manages provider selection, exponential backoff retries, rate limits,
 * timeouts, and returns raw unparsed provider response payloads.
 * ==========================================================
 */

/**
 * Default Provider Engine Settings
 */
export const ENGINE_DEFAULTS = {
  provider: "openai",
  model: "gpt-4o",
  timeoutMs: 30000,
  maxRetries: 3,
};

/**
 * Execute raw AI provider evaluation request with retries.
 *
 * @param {Object} params
 * @param {Object} params.evaluationPackage - Immutable Evaluation Package from Phase 2
 * @param {string} [params.provider='openai'] - Target provider identifier
 * @param {string} [params.model='gpt-4o'] - Target model identifier
 * @param {number} [params.maxRetries=3] - Maximum retry attempts for transient errors
 * @param {number} [params.timeoutMs=30000] - Request timeout in milliseconds
 * @param {AbortSignal} [params.signal] - Abort signal for request cancellation
 * @returns {Promise<Object>} Raw provider execution result
 */
export const executeProviderRequest = async ({
  evaluationPackage,
  provider = ENGINE_DEFAULTS.provider,
  model = ENGINE_DEFAULTS.model,
  maxRetries = ENGINE_DEFAULTS.maxRetries,
  timeoutMs = ENGINE_DEFAULTS.timeoutMs,
  signal,
}) => {
  if (!evaluationPackage) {
    return {
      success: false,
      error: "Missing evaluation package for AI provider execution.",
      errorCode: "MISSING_PACKAGE",
    };
  }

  // Select Provider Adapter
  const adapter = ADAPTERS_MAP[provider?.toLowerCase()];
  if (!adapter) {
    return {
      success: false,
      error: `Unsupported AI provider '${provider}'.`,
      errorCode: "UNSUPPORTED_PROVIDER",
    };
  }

  // Resolve API Key from Environment
  let apiKey = "";
  try {
    apiKey =
      import.meta.env?.VITE_OPENAI_API_KEY ||
      import.meta.env?.VITE_AI_API_KEY ||
      "";
  } catch (e) {
    // Ignore env lookup failure in non-browser environments
  }

  let attempt = 0;
  let lastError = null;

  while (attempt <= maxRetries) {
    if (signal?.aborted) {
      return {
        success: false,
        error: "AI provider request was cancelled.",
        errorCode: "REQUEST_CANCELLED",
      };
    }

    try {
      const rawResult = await adapter.sendEvaluationRequest({
        evaluationPackage,
        apiKey,
        model,
        timeoutMs,
        signal,
      });

      return {
        success: true,
        data: {
          ...rawResult,
          retryCount: attempt,
        },
      };
    } catch (err) {
      lastError = err;
      attempt += 1;

      // Check if error is transient (429 Rate Limit, 503 Service Unavailable, network errors)
      const isRateLimit = err.status === 429;
      const isServerError = err.status >= 500 && err.status <= 599;
      const isNetworkError = !err.status && err.name !== "AbortError";
      const isTransient = isRateLimit || isServerError || isNetworkError;

      // Stop retrying if error is non-transient or max retries reached
      if (!isTransient || attempt > maxRetries || signal?.aborted) {
        break;
      }

      // Exponential backoff with jitter (1s -> 2s -> 4s)
      const backoffMs =
        Math.pow(2, attempt - 1) * 1000 + Math.floor(Math.random() * 200);

      console.warn(
        `[Rocket AI Provider Engine] Transient error (${err.message}). Retrying attempt ${attempt}/${maxRetries} in ${backoffMs}ms...`
      );

      await new Promise((resolve) => setTimeout(resolve, backoffMs));
    }
  }

  console.error("[Rocket AI Provider Engine Error]", lastError);
  return {
    success: false,
    error:
      lastError?.message ||
      `AI Provider '${provider}' failed after ${attempt} attempts.`,
    errorCode: "PROVIDER_REQUEST_FAILED",
    status: lastError?.status || null,
  };
};

/**
 * Exported AI Provider Engine Gateway
 */
export const AIProviderEngineService = {
  ENGINE_DEFAULTS,
  executeProviderRequest,
};

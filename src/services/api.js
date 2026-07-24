import axios from "axios";
import { supabase } from "../supabaseClient";

/**
 * ==========================================================
 * ROCKET PLATFORM
 * Centralized API Client
 * ----------------------------------------------------------
 * Responsibilities:
 * • Creates a single Axios instance
 * • Uses backend URL from .env
 * • Automatically attaches Supabase access token
 * • Provides consistent JSON configuration
 * ==========================================================
 */

import { API_BASE_URL } from "../config/apiConfig";

const api = axios.create({
  baseURL: `${API_BASE_URL}/api`,
  headers: {
    "Content-Type": "application/json",
  },
  timeout: 30000,
});

/**
 * ----------------------------------------------------------
 * Request Interceptor
 * Automatically attach Supabase access token
 * ----------------------------------------------------------
 */
api.interceptors.request.use(
  async (config) => {
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession();

      if (session?.access_token) {
        config.headers.Authorization = `Bearer ${session.access_token}`;
      }

      return config;
    } catch (error) {
      console.error("[API] Failed to attach auth token:", error);
      return config;
    }
  },
  (error) => Promise.reject(error)
);

/**
 * ----------------------------------------------------------
 * Response Interceptor
 * Keeps responses untouched.
 * Logs API errors for debugging.
 * ----------------------------------------------------------
 */
api.interceptors.response.use(
  (response) => response,
  (error) => {
    console.error("[API ERROR]", {
      url: error.config?.url,
      method: error.config?.method,
      status: error.response?.status,
      message: error.response?.data?.message || error.message,
    });

    return Promise.reject(error);
  }
);

export default api;
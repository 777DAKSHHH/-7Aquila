/**
 * Resolves the backend API URL dynamically based on the current environment.
 * If running on localhost/127.0.0.1, it defaults to the local backend server (http://localhost:5000).
 * In production/Render, it defaults to the live Render backend server (https://l-hit-aged7aquila.onrender.com).
 */
export const getBackendUrl = () => {
  if (import.meta.env.VITE_BACKEND_URL) {
    return import.meta.env.VITE_BACKEND_URL;
  }

  const isLocal =
    typeof window !== "undefined" &&
    (window.location.hostname === "localhost" ||
      window.location.hostname === "127.0.0.1" ||
      window.location.hostname.startsWith("192.168."));

  return isLocal ? "http://localhost:5000" : "https://l-hit-aged7aquila.onrender.com";
};

export const API_BASE_URL = getBackendUrl();

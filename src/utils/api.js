/**
 * Central API Utility - ShopTech
 * Handles Render free-tier cold starts with retry + exponential backoff
 */

const configuredApiBase = String(import.meta.env.VITE_API_BASE_URL || "").trim().replace(/\/$/, "");

export const API_BASE = configuredApiBase
  || "https://shoptech-backend.onrender.com";

/**
 * Fetch with retry and exponential backoff.
 * Great for Render free tier which sleeps after 15 min of inactivity.
 * @param {string} url
 * @param {RequestInit} options
 * @param {number} retries - number of retries (default 3)
 * @param {number} delayMs - initial delay in ms (default 1500)
 */
export async function fetchWithRetry(url, options = {}, retries = 3, delayMs = 1500) {
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 15000); // 15s timeout per attempt

      const response = await fetch(url, {
        ...options,
        signal: controller.signal,
      });

      clearTimeout(timeoutId);
      return response;
    } catch (err) {
      const isLast = attempt === retries;
      if (isLast) throw err;

      // Exponential backoff: 1.5s, 3s, 6s
      const wait = delayMs * Math.pow(2, attempt);
      console.warn(`[API] Attempt ${attempt + 1} failed. Retrying in ${wait}ms...`, err.message);
      await new Promise((res) => setTimeout(res, wait));
    }
  }
}

/**
 * Ping the backend health check to wake it up from Render sleep.
 * Call this early on app load.
 */
export async function wakeUpBackend() {
  try {
    await fetch(`${API_BASE}/api/status`, { method: "GET" });
  } catch (_) {
    // silently fail – just a warm-up ping
  }
}

/** Authenticated fetch helper */
export function authHeaders() {
  const token = localStorage.getItem("token");
  return token ? { Authorization: `Bearer ${token}` } : {};
}

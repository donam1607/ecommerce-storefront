import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim().replace(/\/$/, '');
const VISITOR_ID_KEY = '_shoptech_vid';

/**
 * Sinh visitorId ngắn (<= 36 chars) an toàn trên cả HTTP và HTTPS.
 * Ưu tiên crypto.randomUUID() nếu có (HTTPS/localhost),
 * fallback sang UUID v4 thủ công cho HTTP thường.
 */
function generateVisitorId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID(); // 36 chars, e.g. "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx"
    }
  } catch (_) { /* not secure context */ }
  // Manual UUID v4 fallback — always 36 chars
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * useVisitorTrack — records page visits for analytics.
 * Runs on route changes, utilizing a local storage device UUID with safe fallback.
 */
export function useVisitorTrack() {
  const location = useLocation();
  const timerRef = useRef(null);

  useEffect(() => {
    // Debounce to handle React StrictMode double-invocation on mount
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      try {
        // 1. Get or create anonymous visitor UUID (guaranteed <= 36 chars)
        let visitorId = localStorage.getItem(VISITOR_ID_KEY);
        if (!visitorId) {
          visitorId = generateVisitorId();
          localStorage.setItem(VISITOR_ID_KEY, visitorId);
        }

        // 2. Try to extract userId from stored JWT (if logged in)
        let userId = null;
        try {
          const token = localStorage.getItem('token');
          if (token) {
            const payload = JSON.parse(atob(token.split('.')[1]));
            userId = payload?.id || null;
          }
        } catch {
          // Token missing or malformed — ignore
        }

        // 3. Fire-and-forget visit recording
        const res = await fetch(`${API_BASE}/api/analytics/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, userId }),
        });
        if (!res.ok) {
          console.warn('[analytics] visit record failed:', res.status, await res.text().catch(() => ''));
        }
      } catch (err) {
        // Log lỗi mạng để dễ debug, nhưng không crash ứng dụng
        console.warn('[analytics] network error:', err?.message);
      }
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);
}

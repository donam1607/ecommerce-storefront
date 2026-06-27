import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = import.meta.env.VITE_API_URL || 'http://localhost:5000';
const VISITOR_ID_KEY = '_shoptech_vid';

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
        // 1. Get or create anonymous visitor UUID with secure context check
        let visitorId = localStorage.getItem(VISITOR_ID_KEY);
        if (!visitorId) {
          if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
            visitorId = crypto.randomUUID();
          } else {
            // Fallback for non-secure HTTP connections or older browsers
            visitorId = 'vid-' + Math.random().toString(36).substring(2, 15) + '-' + Date.now().toString(36);
          }
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
        await fetch(`${API_BASE}/api/analytics/visit`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ visitorId, userId }),
        });
      } catch {
        // Silently catch network errors to keep the application stable
      }
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);
}

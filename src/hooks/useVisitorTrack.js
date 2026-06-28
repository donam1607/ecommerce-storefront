import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim().replace(/\/$/, '');
const VISITOR_ID_KEY = '_shoptech_vid';
const LAST_SENT_USER_KEY = '_shoptech_last_uid';

/**
 * Sinh visitorId ngắn (<= 36 chars) an toàn trên cả HTTP và HTTPS.
 */
function generateVisitorId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (_) { /* not secure context */ }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Lấy userId từ JWT trong localStorage.
 */
function getCurrentUserId() {
  try {
    const token = localStorage.getItem('token');
    if (!token) return null;
    const payload = JSON.parse(atob(token.split('.')[1]));
    return payload?.id || null;
  } catch {
    return null;
  }
}

// Client properties extraction helpers
function getScreenResolution() {
  return typeof window !== 'undefined' ? `${window.screen.width}x${window.screen.height}` : null;
}

function getBrowserLanguage() {
  return typeof navigator !== 'undefined' ? (navigator.language || navigator.userLanguage || 'vi-VN') : null;
}

function getEntryPage() {
  if (typeof window === 'undefined' || typeof sessionStorage === 'undefined') return null;
  let entry = sessionStorage.getItem('_shoptech_entry');
  if (!entry) {
    entry = window.location.href;
    sessionStorage.setItem('_shoptech_entry', entry);
  }
  return entry;
}

function getReferrer() {
  return typeof document !== 'undefined' ? (document.referrer || 'Direct') : 'Direct';
}

/**
 * Gửi lượt truy cập lên server.
 */
async function recordVisit(visitorId, userId) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        visitorId,
        userId,
        screenResolution: getScreenResolution(),
        browserLanguage: getBrowserLanguage(),
        entryPage: getEntryPage(),
        referrer: getReferrer()
      }),
    });
    if (!res.ok) {
      console.warn('[analytics] visit record failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('[analytics] network error:', err?.message);
  }
}

/**
 * useVisitorTrack — Ghi nhận lượt truy cập khi chuyển trang hoặc đổi login status
 */
export function useVisitorTrack() {
  const location = useLocation();
  const timerRef = useRef(null);

  // === Trigger 1: Route thay đổi ===
  useEffect(() => {
    clearTimeout(timerRef.current);
    timerRef.current = setTimeout(async () => {
      let visitorId = localStorage.getItem(VISITOR_ID_KEY);
      if (!visitorId) {
        visitorId = generateVisitorId();
        localStorage.setItem(VISITOR_ID_KEY, visitorId);
      }
      const userId = getCurrentUserId();
      localStorage.setItem(LAST_SENT_USER_KEY, userId || '');
      await recordVisit(visitorId, userId);
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  // === Trigger 2: Login/logout changes ===
  useEffect(() => {
    const handleStorageChange = async (e) => {
      if (e instanceof StorageEvent && e.key !== 'token') return;

      const userId = getCurrentUserId();
      const lastSentUid = localStorage.getItem(LAST_SENT_USER_KEY) || '';

      if ((userId || '') === lastSentUid) return;

      const visitorId = localStorage.getItem(VISITOR_ID_KEY) || generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      localStorage.setItem(LAST_SENT_USER_KEY, userId || '');

      await recordVisit(visitorId, userId);
    };

    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleStorageChange);
    };
  }, []);
}

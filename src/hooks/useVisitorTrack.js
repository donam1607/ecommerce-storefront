import { useEffect, useRef } from 'react';
import { useLocation } from 'react-router-dom';

const API_BASE = String(import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000').trim().replace(/\/$/, '');
const VISITOR_ID_KEY = '_shoptech_vid';
// Key để theo dõi userId đã gửi lần cuối — tránh gửi trùng khi không có gì thay đổi
const LAST_SENT_USER_KEY = '_shoptech_last_uid';

/**
 * Sinh visitorId ngắn (<= 36 chars) an toàn trên cả HTTP và HTTPS.
 * Ưu tiên crypto.randomUUID() nếu có (HTTPS/localhost),
 * fallback sang UUID v4 thủ công cho HTTP thường.
 */
function generateVisitorId() {
  try {
    if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
      return crypto.randomUUID();
    }
  } catch (_) { /* not secure context */ }
  // Manual UUID v4 fallback — always 36 chars
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0;
    return (c === 'x' ? r : (r & 0x3) | 0x8).toString(16);
  });
}

/**
 * Lấy userId từ JWT trong localStorage.
 * Trả về null nếu chưa đăng nhập hoặc token lỗi.
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

/**
 * Gửi lượt truy cập lên server.
 */
async function recordVisit(visitorId, userId) {
  try {
    const res = await fetch(`${API_BASE}/api/analytics/visit`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ visitorId, userId }),
    });
    if (!res.ok) {
      console.warn('[analytics] visit record failed:', res.status, await res.text().catch(() => ''));
    }
  } catch (err) {
    console.warn('[analytics] network error:', err?.message);
  }
}

/**
 * useVisitorTrack — ghi nhận lượt truy cập khi:
 * 1. Người dùng điều hướng sang trang khác (pathname thay đổi)
 * 2. Trạng thái đăng nhập thay đổi (đăng nhập / đăng xuất)
 *    → Đảm bảo "Đã đăng nhập hôm nay" được cập nhật ngay khi login
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
      // Cập nhật userId đã gửi gần nhất
      localStorage.setItem(LAST_SENT_USER_KEY, userId || '');
      await recordVisit(visitorId, userId);
    }, 500);

    return () => clearTimeout(timerRef.current);
  }, [location.pathname]);

  // === Trigger 2: Theo dõi sự kiện storage để bắt login/logout ===
  // Khi token được ghi vào localStorage (đăng nhập), storage event bắn ra
  // → gửi lại visit với userId mới để cập nhật "Đã đăng nhập hôm nay"
  useEffect(() => {
    const handleStorageChange = async (e) => {
      // StorageEvent (cross-tab): chỉ quan tâm khi key là 'token'
      // Custom Event 'auth-changed' (same-tab): không có e.key, luôn xử lý
      if (e instanceof StorageEvent && e.key !== 'token') return;

      const userId = getCurrentUserId();
      const lastSentUid = localStorage.getItem(LAST_SENT_USER_KEY) || '';

      // Tránh gửi trùng nếu userId không thay đổi
      if ((userId || '') === lastSentUid) return;

      const visitorId = localStorage.getItem(VISITOR_ID_KEY) || generateVisitorId();
      localStorage.setItem(VISITOR_ID_KEY, visitorId);
      localStorage.setItem(LAST_SENT_USER_KEY, userId || '');

      await recordVisit(visitorId, userId);
    };

    // storage event chỉ bắn cho các tab/window KHÁC cùng origin.
    // Để bắt login trong cùng tab, dùng custom event 'auth-change'
    window.addEventListener('storage', handleStorageChange);
    window.addEventListener('auth-changed', handleStorageChange);

    return () => {
      window.removeEventListener('storage', handleStorageChange);
      window.removeEventListener('auth-changed', handleStorageChange);
    };
  }, []);
}

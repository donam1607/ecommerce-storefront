import { API_BASE } from "./api";

const VISITOR_ID_KEY = "_shoptech_vid";

export function getVisitorId() {
  let visitorId = localStorage.getItem(VISITOR_ID_KEY);
  if (visitorId) return visitorId;
  try {
    visitorId = crypto.randomUUID();
  } catch {
    visitorId = "xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx".replace(/[xy]/g, (c) => {
      const r = (Math.random() * 16) | 0;
      return (c === "x" ? r : (r & 0x3) | 0x8).toString(16);
    });
  }
  localStorage.setItem(VISITOR_ID_KEY, visitorId);
  return visitorId;
}

export function getCurrentUserId() {
  try {
    const token = localStorage.getItem("token");
    if (!token) return null;
    return JSON.parse(atob(token.split(".")[1]))?.id || null;
  } catch {
    return null;
  }
}

export function trackUserEvent(eventType, data = {}) {
  try {
    fetch(`${API_BASE}/api/analytics/event`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      keepalive: true,
      body: JSON.stringify({
        visitorId: getVisitorId(),
        userId: getCurrentUserId(),
        eventType,
        page: window.location.pathname + window.location.search,
        productId: data.productId || null,
        metadata: data.metadata || {},
      }),
    }).catch(() => {});
  } catch {
    // Analytics must never block customer actions.
  }
}

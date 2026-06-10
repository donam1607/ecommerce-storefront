import React, { useEffect, useRef, useState } from "react";
import { Loader2 } from "lucide-react";
import { API_BASE } from "../utils/api";

const GOOGLE_SCRIPT_SRC = "https://accounts.google.com/gsi/client";

let googleScriptPromise = null;

const loadGoogleScript = () => {
  if (window.google?.accounts?.id) return Promise.resolve();
  if (googleScriptPromise) return googleScriptPromise;

  googleScriptPromise = new Promise((resolve, reject) => {
    const existingScript = document.querySelector(`script[src="${GOOGLE_SCRIPT_SRC}"]`);
    if (existingScript) {
      existingScript.addEventListener("load", resolve, { once: true });
      existingScript.addEventListener("error", reject, { once: true });
      return;
    }

    const script = document.createElement("script");
    script.src = GOOGLE_SCRIPT_SRC;
    script.async = true;
    script.defer = true;
    script.onload = resolve;
    script.onerror = reject;
    document.head.appendChild(script);
  });

  return googleScriptPromise;
};

export default function GoogleLoginButton({ onSuccess, onError, disabled = false, text = "signin_with" }) {
  const buttonRef = useRef(null);
  const [loading, setLoading] = useState(false);
  const [ready, setReady] = useState(false);
  const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;

  useEffect(() => {
    if (!clientId || disabled) return;
    let cancelled = false;

    loadGoogleScript()
      .then(() => {
        if (cancelled || !buttonRef.current || !window.google?.accounts?.id) return;

        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: async (response) => {
            if (!response?.credential) {
              onError?.("Không nhận được mã xác thực từ Google.");
              return;
            }

            setLoading(true);
            try {
              const apiResponse = await fetch(`${API_BASE}/api/auth/google`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ credential: response.credential }),
              });
              const data = await apiResponse.json();

              if (!apiResponse.ok) {
                throw new Error(data.message || "Đăng nhập Google không thành công.");
              }

              onSuccess?.(data);
            } catch (error) {
              onError?.(error.message || "Không thể đăng nhập bằng Google.");
            } finally {
              setLoading(false);
            }
          },
        });

        buttonRef.current.innerHTML = "";
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: "outline",
          size: "large",
          type: "standard",
          shape: "pill",
          text,
          width: buttonRef.current.offsetWidth || 340,
        });
        setReady(true);
      })
      .catch(() => {
        if (!cancelled) onError?.("Không thể tải Google Sign-In.");
      });

    return () => {
      cancelled = true;
    };
  }, [clientId, disabled, onError, onSuccess, text]);

  if (!clientId) {
    return (
      <div className="w-full rounded-2xl border border-amber-200 bg-amber-50 px-4 py-3 text-center text-xs font-bold text-amber-700 dark:border-amber-900/60 dark:bg-amber-950/20 dark:text-amber-300">
        Chưa cấu hình VITE_GOOGLE_CLIENT_ID
      </div>
    );
  }

  return (
    <div className="relative min-h-[44px] w-full">
      <div className={disabled || loading ? "pointer-events-none opacity-60" : ""} ref={buttonRef} />
      {(!ready || loading) && (
        <div className="absolute inset-0 flex items-center justify-center rounded-full border border-slate-200 bg-white text-xs font-bold text-slate-500 dark:border-slate-700 dark:bg-slate-900 dark:text-slate-300">
          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          {loading ? "Đang xác thực..." : "Đang tải Google..."}
        </div>
      )}
    </div>
  );
}

import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle, ShoppingBag, Sparkles } from "lucide-react";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [shake, setShake] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const completeLogin = (data, message = "Đăng nhập thành công! Đang chuyển hướng...") => {
    setResult({ success: true, data });
    showToast(message, "success");
    localStorage.setItem("token", data.token);
    localStorage.setItem("user", JSON.stringify({
      id: data.id, name: data.name, email: data.email, role: data.role,
      phone: data.phone || "", address: data.address || "", city: data.city || "",
    }));
    setTimeout(() => {
      window.dispatchEvent(new Event("auth-changed"));
      navigate(data.role && data.role !== "user" ? "/admin" : "/");
    }, 1000);
  };

  const handleGoogleError = (message) => {
    setResult({ success: false, message });
    showToast(message || "Đăng nhập Google không thành công!", "error");
    setShake(true);
    setTimeout(() => setShake(false), 550);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);
    try {
      const API_URL = "https://shoptech-backend.onrender.com";
      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await response.json();
      if (response.ok) {
        completeLogin(data);
      } else {
        setResult({ success: false, message: data.message });
        showToast(data.message || "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
        setShake(true);
        setTimeout(() => setShake(false), 550);
      }
    } catch (error) {
      setResult({ success: false, message: "Không thể kết nối tới Server." });
      showToast("Không thể kết nối tới máy chủ. Hãy thử lại!", "error");
      setShake(true);
      setTimeout(() => setShake(false), 550);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "peer w-full pl-11 pr-4 pt-6 pb-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4 backdrop-blur-sm";
  const labelClass = "absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 font-semibold";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50/30 to-indigo-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-indigo-950/20 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Floating orb decorations */}
      <div className="absolute top-1/4 -left-24 w-72 h-72 bg-blue-500/10 dark:bg-blue-500/5 rounded-full blur-3xl pointer-events-none animate-float-slow" />
      <div className="absolute bottom-1/4 -right-24 w-72 h-72 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-float" style={{animationDelay:'2s'}} />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-purple-500/5 dark:bg-purple-500/3 rounded-full blur-3xl pointer-events-none" />

      <div className="max-w-md w-full animate-scale-in relative z-10">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-2xl shadow-xl shadow-blue-500/25 mb-4 animate-float">
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Shop<span className="text-blue-600 dark:text-blue-400">Tech</span></h1>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white/60 dark:border-slate-800/50 p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Chào mừng trở lại 👋</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">Đăng nhập để tiếp tục trải nghiệm mua sắm</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
              {/* Email Field */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none transition-colors" />
                <input
                  type="email" id="login-email" required placeholder=" "
                  className={inputClass}
                  value={email} onChange={(e) => setEmail(e.target.value)}
                />
                <label htmlFor="login-email" className={labelClass}>Email</label>
              </div>

              {/* Password Field */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none transition-colors" />
                <input
                  type="password" id="login-password" required placeholder=" "
                  className={inputClass}
                  value={password} onChange={(e) => setPassword(e.target.value)}
                />
                <label htmlFor="login-password" className={labelClass}>Mật khẩu</label>
              </div>
            </div>

            <RippleButton
              type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-blue-500/25 hover:shadow-blue-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><Sparkles className="h-4 w-4" />Đăng nhập ngay</>
              )}
            </RippleButton>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hoặc</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
          </div>

          <GoogleLoginButton
            disabled={loading}
            onSuccess={(data) => completeLogin(data, "Đăng nhập Google thành công!")}
            onError={handleGoogleError}
          />

          {result && (
            <div className={`p-4 rounded-2xl border transition-all animate-fade-in ${result.success
              ? "bg-emerald-50/80 border-emerald-200/60 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400"
              : "bg-red-50/80 border-red-200/60 text-red-800 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400"
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
                {result.success ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
                {result.success ? "Đăng nhập thành công!" : "Lỗi đăng nhập"}
              </div>
              <p className="text-xs opacity-90">
                {result.success
                  ? `Đang chuyển hướng về trang ${result.data.role === 'admin' ? 'Quản trị' : 'Chủ'}...`
                  : result.message}
              </p>
            </div>
          )}

          <div className="text-center space-y-2 pt-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Chưa có tài khoản?{" "}
              <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
                Đăng ký tài khoản mới
              </Link>
            </p>
            <Link to="/" className="inline-block text-xs font-semibold text-slate-400 hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
              ← Quay lại trang chủ
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

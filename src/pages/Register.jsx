import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, CheckCircle2, AlertCircle, ShoppingBag, UserPlus } from "lucide-react";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";
import GoogleLoginButton from "../components/GoogleLoginButton";

export default function Register() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [shake, setShake] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

  const completeGoogleAuth = (data) => {
    setResult({ success: true, data });
    showToast("Đăng nhập Google thành công!", "success");
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

    if (password !== confirmPassword) {
      setResult({ success: false, message: "Mật khẩu xác nhận không trùng khớp!" });
      showToast("Mật khẩu xác nhận không trùng khớp!", "error");
      setShake(true);
      setTimeout(() => setShake(false), 550);
      setLoading(false);
      return;
    }

    try {
      const API_URL = "https://shoptech-backend.onrender.com";
      const response = await fetch(`${API_URL}/api/auth/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, data });
        showToast("Đăng ký tài khoản thành công!", "success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          id: data.id, name: data.name, email: data.email, role: data.role
        }));
        setTimeout(() => { navigate("/"); window.location.reload(); }, 1200);
      } else {
        setResult({ success: false, message: data.message });
        showToast(data.message || "Đăng ký không thành công!", "error");
        setShake(true);
        setTimeout(() => setShake(false), 550);
      }
    } catch (error) {
      setResult({ success: false, message: "Không thể kết nối tới Server." });
      showToast("Lỗi kết nối máy chủ. Hãy thử lại sau!", "error");
      setShake(true);
      setTimeout(() => setShake(false), 550);
    } finally {
      setLoading(false);
    }
  };

  const inputClass = "peer w-full pl-11 pr-4 pt-6 pb-2 bg-white/50 dark:bg-slate-900/50 border border-slate-200/60 dark:border-slate-700/60 rounded-2xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4 backdrop-blur-sm";
  const labelClass = "absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-500 font-semibold";

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/20 dark:from-slate-950 dark:via-slate-950 dark:to-purple-950/20 flex items-center justify-center p-4 relative overflow-hidden transition-colors duration-300">
      {/* Floating orb decorations */}
      <div className="absolute top-1/4 -right-24 w-80 h-80 bg-indigo-500/10 dark:bg-indigo-500/5 rounded-full blur-3xl pointer-events-none animate-float" />
      <div className="absolute bottom-1/4 -left-24 w-80 h-80 bg-purple-500/10 dark:bg-purple-500/5 rounded-full blur-3xl pointer-events-none animate-float-slow" style={{animationDelay:'1.5s'}} />

      <div className="max-w-md w-full animate-scale-in relative z-10">
        {/* Logo header */}
        <div className="text-center mb-8">
          <div className="inline-flex items-center justify-center w-14 h-14 bg-gradient-to-br from-indigo-600 to-purple-600 rounded-2xl shadow-xl shadow-indigo-500/25 mb-4 animate-float">
            <ShoppingBag className="h-7 w-7 text-white" />
          </div>
          <h1 className="text-2xl font-black text-slate-900 dark:text-white">Shop<span className="text-blue-600 dark:text-blue-400">Tech</span></h1>
        </div>

        {/* Card */}
        <div className="bg-white/80 dark:bg-slate-900/80 backdrop-blur-xl rounded-3xl shadow-2xl shadow-slate-200/50 dark:shadow-slate-950/50 border border-white/60 dark:border-slate-800/50 p-8 space-y-6">
          <div className="text-center">
            <h2 className="text-2xl font-black text-slate-900 dark:text-white">Tạo tài khoản mới ✨</h2>
            <p className="mt-1.5 text-sm text-slate-500 dark:text-slate-400 font-medium">Khám phá và sở hữu các sản phẩm công nghệ hàng đầu</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-5">
            <div className={`space-y-3.5 ${shake ? "animate-shake" : ""}`}>
              {/* Name */}
              <div className="relative">
                <User className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none" />
                <input type="text" id="reg-name" required placeholder=" " className={inputClass} value={name} onChange={(e) => setName(e.target.value)} />
                <label htmlFor="reg-name" className={labelClass}>Họ và tên</label>
              </div>
              {/* Email */}
              <div className="relative">
                <Mail className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none" />
                <input type="email" id="reg-email" required placeholder=" " className={inputClass} value={email} onChange={(e) => setEmail(e.target.value)} />
                <label htmlFor="reg-email" className={labelClass}>Địa chỉ Email</label>
              </div>
              {/* Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none" />
                <input type="password" id="reg-password" required placeholder=" " className={inputClass} value={password} onChange={(e) => setPassword(e.target.value)} />
                <label htmlFor="reg-password" className={labelClass}>Mật khẩu</label>
              </div>
              {/* Confirm Password */}
              <div className="relative">
                <Lock className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 pointer-events-none" />
                <input type="password" id="reg-confirm" required placeholder=" " className={inputClass} value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} />
                <label htmlFor="reg-confirm" className={labelClass}>Xác nhận mật khẩu</label>
              </div>
            </div>

            <RippleButton
              type="submit" disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 hover:from-indigo-500 hover:to-purple-500 text-white font-bold rounded-2xl transition-all shadow-lg shadow-indigo-500/25 hover:shadow-indigo-500/40 hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
            >
              {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : (
                <><UserPlus className="h-4 w-4" />Đăng ký ngay</>
              )}
            </RippleButton>
          </form>

          <div className="flex items-center gap-3">
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
            <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hoặc</span>
            <div className="h-px flex-1 bg-gradient-to-r from-transparent via-slate-200 dark:via-slate-700 to-transparent" />
          </div>

          <GoogleLoginButton disabled={loading} text="signup_with" onSuccess={completeGoogleAuth} onError={handleGoogleError} />

          {result && (
            <div className={`p-4 rounded-2xl border animate-fade-in ${result.success
              ? "bg-emerald-50/80 border-emerald-200/60 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/40 dark:text-emerald-400"
              : "bg-red-50/80 border-red-200/60 text-red-800 dark:bg-red-900/20 dark:border-red-800/40 dark:text-red-400"
            }`}>
              <div className="flex items-center gap-2 mb-1.5 font-bold text-sm">
                {result.success ? <CheckCircle2 className="h-4.5 w-4.5" /> : <AlertCircle className="h-4.5 w-4.5" />}
                {result.success ? "Đăng ký thành công!" : "Lỗi đăng ký"}
              </div>
              <p className="text-xs opacity-90">{result.success ? "Đang chuyển hướng về trang chủ..." : result.message}</p>
            </div>
          )}

          <div className="text-center space-y-2 pt-1">
            <p className="text-sm text-slate-500 dark:text-slate-400">
              Đã có tài khoản?{" "}
              <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">Đăng nhập</Link>
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

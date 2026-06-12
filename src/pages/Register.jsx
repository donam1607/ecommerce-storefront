import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Mail, Lock, User, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
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
      id: data.id,
      name: data.name,
      email: data.email,
      role: data.role,
      phone: data.phone || "",
      address: data.address || "",
      city: data.city || "",
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
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role
        }));
        
        setTimeout(() => {
          navigate("/");
          window.location.reload(); 
        }, 1200);
      } else {
        setResult({ success: false, message: data.message });
        showToast(data.message || "Đăng ký không thành công!", "error");
        setShake(true);
        setTimeout(() => setShake(false), 550);
      }
    } catch (error) {
      setResult({ success: false, message: "Không thể kết nối tới Server. Hãy kiểm tra kết nối mạng." });
      showToast("Lỗi kết nối máy chủ. Hãy thử lại sau!", "error");
      setShake(true);
      setTimeout(() => setShake(false), 550);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800 animate-fade-in-up">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Đăng ký tài khoản</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Khám phá và sở hữu các sản phẩm công nghệ hàng đầu ngay hôm nay</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
            {/* Name Input */}
            <div className="relative">
              <User className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 transition-colors peer-focus:text-blue-500 pointer-events-none" />
              <input
                type="text"
                id="name"
                required
                placeholder=" "
                className="peer w-full pl-11 pr-4 pt-6 pb-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4"
                value={name}
                onChange={(e) => setName(e.target.value)}
              />
              <label
                htmlFor="name"
                className="absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-550"
              >
                Họ và tên
              </label>
            </div>

            {/* Email Input */}
            <div className="relative">
              <Mail className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 transition-colors peer-focus:text-blue-500 pointer-events-none" />
              <input
                type="email"
                id="email"
                required
                placeholder=" "
                className="peer w-full pl-11 pr-4 pt-6 pb-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <label
                htmlFor="email"
                className="absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-550"
              >
                Địa chỉ Email
              </label>
            </div>

            {/* Password Input */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 transition-colors peer-focus:text-blue-500 pointer-events-none" />
              <input
                type="password"
                id="password"
                required
                placeholder=" "
                className="peer w-full pl-11 pr-4 pt-6 pb-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
              <label
                htmlFor="password"
                className="absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-550"
              >
                Mật khẩu
              </label>
            </div>

            {/* Confirm Password Input */}
            <div className="relative">
              <Lock className="absolute left-3.5 top-[1.35rem] h-5 w-5 text-slate-400 transition-colors peer-focus:text-blue-500 pointer-events-none" />
              <input
                type="password"
                id="confirmPassword"
                required
                placeholder=" "
                className="peer w-full pl-11 pr-4 pt-6 pb-2 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-blue-500 outline-none transition-all text-sm placeholder-shown:py-4"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <label
                htmlFor="confirmPassword"
                className="absolute left-11 top-2 text-[10px] text-slate-400 dark:text-slate-500 pointer-events-none transition-all duration-200 peer-placeholder-shown:top-3.5 peer-placeholder-shown:text-sm peer-focus:top-2 peer-focus:text-[10px] peer-focus:text-blue-550"
              >
                Xác nhận mật khẩu
              </label>
            </div>
          </div>

          <RippleButton
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đăng ký ngay"}
          </RippleButton>
        </form>

        <div className="flex items-center gap-3">
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
          <span className="text-[10px] font-black uppercase tracking-wider text-slate-400">Hoặc</span>
          <div className="h-px flex-1 bg-slate-200 dark:bg-slate-800" />
        </div>

        <GoogleLoginButton
          disabled={loading}
          text="signup_with"
          onSuccess={completeGoogleAuth}
          onError={handleGoogleError}
        />

        {/* Results */}
        {result && (
          <div className={`mt-6 p-4 rounded-2xl border transition-all animate-fade-in ${result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"}`}>
            <div className="flex items-center gap-2 mb-2 font-bold">
              {result.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {result.success ? "Đăng ký thành công!" : "Lỗi đăng ký"}
            </div>
            <p className="text-sm">{result.success ? "Đang chuyển hướng về trang chủ..." : result.message}</p>
          </div>
        )}

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Đã có tài khoản?{" "}
            <Link to="/login" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Đăng nhập
            </Link>
          </p>
          <Link to="/" className="inline-block text-sm font-medium text-slate-500 hover:text-blue-600 dark:text-slate-400 dark:hover:text-blue-400 transition-colors">
            Quay lại trang chủ
          </Link>
        </div>
      </div>
    </div>
  );
}

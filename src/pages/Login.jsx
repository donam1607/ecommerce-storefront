import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";
import { useToast } from "../context/ToastContext";
import RippleButton from "../components/RippleButton";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [shake, setShake] = useState(false);
  const { showToast } = useToast();
  const navigate = useNavigate();

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
        setResult({ success: true, data });
        showToast("Đăng nhập thành công! Đang chuyển hướng...", "success");
        localStorage.setItem("token", data.token);
        localStorage.setItem("user", JSON.stringify({
          id: data.id,
          name: data.name,
          email: data.email,
          role: data.role,
          phone: data.phone || "",
          address: data.address || "",
          city: data.city || "",
          zip: data.zip || "",
        }));

        setTimeout(() => {
          window.dispatchEvent(new Event("auth-changed"));
          if (data.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
        }, 1000);
      } else {
        setResult({ success: false, message: data.message });
        showToast(data.message || "Tên đăng nhập hoặc mật khẩu không đúng!", "error");
        setShake(true);
        setTimeout(() => setShake(false), 550);
      }
    } catch (error) {
      setResult({ success: false, message: "Không thể kết nối tới Server. Hãy kiểm tra kết nối mạng." });
      showToast("Không thể kết nối tới máy chủ. Hãy thử lại!", "error");
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
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Chào mừng trở lại</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Đăng nhập để tiếp tục trải nghiệm</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className={`space-y-4 ${shake ? "animate-shake" : ""}`}>
            {/* Email Field */}
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
                Email
              </label>
            </div>

            {/* Password Field */}
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
          </div>

          <RippleButton
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 disabled:opacity-70 cursor-pointer"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đăng nhập ngay"}
          </RippleButton>
        </form>

        {/* Kết quả đăng nhập */}
        {result && (
          <div className={`mt-6 p-4 rounded-2xl border transition-all animate-fade-in ${result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"}`}>
            <div className="flex items-center gap-2 mb-2 font-bold">
              {result.success ? <CheckCircle2 className="h-5 w-5" /> : <AlertCircle className="h-5 w-5" />}
              {result.success ? "Đăng nhập thành công!" : "Lỗi đăng nhập"}
            </div>
            <p className="text-sm">
              {result.success 
                ? `Đang chuyển hướng về trang ${result.data.role === 'admin' ? 'Quản trị' : 'Chủ'}...` 
                : result.message
              }
            </p>
          </div>
        )}

        <div className="text-center mt-4 space-y-2">
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Chưa có tài khoản?{" "}
            <Link to="/register" className="text-blue-600 dark:text-blue-400 font-bold hover:underline">
              Đăng ký tài khoản mới
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
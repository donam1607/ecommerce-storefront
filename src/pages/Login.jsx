import React, { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { Lock, Mail, Loader2, CheckCircle2, AlertCircle } from "lucide-react";

export default function Login() {
  const [email, setEmail] = useState("admin@example.com");
  const [password, setPassword] = useState("admin123");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setResult(null);

    try {
      const API_URL = window.location.hostname === "localhost" 
        ? "http://localhost:5000" 
        : "https://shoptech-backend.onrender.com";

      const response = await fetch(`${API_URL}/api/auth/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const data = await response.json();

      if (response.ok) {
        setResult({ success: true, data });
        // Lưu token và thông tin user vào localStorage
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

        // Chờ 1s rồi chuyển hướng dựa vào vai trò
        setTimeout(() => {
          if (data.role === "admin") {
            navigate("/admin");
          } else {
            navigate("/");
          }
          window.location.reload(); // Reload để Navbar cập nhật trạng thái
        }, 1000);
      } else {
        setResult({ success: false, message: data.message });
      }
    } catch (error) {
      setResult({ success: false, message: "Không thể kết nối tới Server. Hãy kiểm tra Backend đã chạy chưa (port 5000)." });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-950 flex items-center justify-center p-4 transition-colors duration-300">
      <div className="max-w-md w-full space-y-8 bg-white dark:bg-slate-900 p-8 rounded-3xl shadow-xl border border-slate-200 dark:border-slate-800">
        <div className="text-center">
          <h2 className="text-3xl font-black text-slate-900 dark:text-white">Chào mừng trở lại</h2>
          <p className="mt-2 text-slate-500 dark:text-slate-400">Đăng nhập để tiếp tục trải nghiệm</p>
        </div>

        <form className="mt-8 space-y-6" onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="email"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Email (mặc định: admin@example.com)"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            </div>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-slate-400" />
              <input
                type="password"
                required
                className="w-full pl-10 pr-4 py-3 bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-xl text-slate-900 dark:text-white focus:ring-2 focus:ring-blue-500 outline-none transition-all"
                placeholder="Mật khẩu (mặc định: admin123)"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-4 bg-blue-600 hover:bg-blue-500 text-white font-bold rounded-xl transition-all shadow-lg shadow-blue-600/20 flex items-center justify-center gap-2 active:scale-[0.98] disabled:opacity-70"
          >
            {loading ? <Loader2 className="h-5 w-5 animate-spin" /> : "Đăng nhập ngay"}
          </button>
        </form>

        {/* Kết quả đăng nhập */}
        {result && (
          <div className={`mt-6 p-4 rounded-2xl border ${result.success ? "bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/50 dark:text-emerald-400" : "bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:border-red-800/50 dark:text-red-400"}`}>
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